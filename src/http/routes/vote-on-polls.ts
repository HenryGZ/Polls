import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import {z} from "zod";
import {randomUUID} from "node:crypto";
import {redis} from "../../lib/redis";
import { voting } from "../../utils/votion-pub-sub";

export async function voteOnPoll(app: FastifyInstance){
    app.post("/poll/:pollId/votes", async (req, reply) => {
        const voteOnPollBody = z.object({
            pollOptionId: z.string().uuid(),
        }); //verifica se o body da requisição é um objeto com a chave title e valor string

        const voteOnPollParams = z.object({
            pollId: z.string().uuid(),
        });

        const {pollId} = voteOnPollParams.parse(req.params);
        const {pollOptionId} = voteOnPollBody.parse(req.body); //retorna o body se ele existir usando o zod

        let sessionId = req.cookies.sessionId;

        if(sessionId){
            const userPreviousVotesOnPoll = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId
                    }
                }
            })
            if(userPreviousVotesOnPoll){

                if(userPreviousVotesOnPoll.pollOptionId != pollOptionId){
                    await prisma.vote.delete({
                        where: {
                            id: userPreviousVotesOnPoll.id
                            }
                        },
                    )   
                    const votes = await redis.zincrby(pollId, -1, userPreviousVotesOnPoll.pollOptionId) //decrementa o valor do ranking da enquete dentro do redis

                    voting.publish(pollId, {
                        pollOptionId,
                        votes: Number(votes)
                    }) //publica a mensagem no pubsub

                }
                else if(userPreviousVotesOnPoll){
                    return reply.status(400).send({error: "User has already voted on this poll"})
                }
            }
        }

        if (!sessionId) {
            sessionId = randomUUID();

            reply.setCookie("sessionId", sessionId, {
                path: "/",
                maxAge: 60 * 60 * 24 * 30, //30 dias de duração, multiplicação dos segundos
                signed: true, //assina o cookie para que ele não possa ser alterado
                httpOnly: true, //não permite que o cookie seja acessado pelo javascript
            });
        }

        await prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId,
            }
        })

        const votes = await redis.zincrby(pollId, 1, pollOptionId) //incrementa o a pontuação no redis para a opção escolhida

        voting.publish(pollId, {
            pollOptionId,
            votes: Number(votes)
        }) //publica a mensagem no pubsub

        return reply.status(201).send();
    })
};