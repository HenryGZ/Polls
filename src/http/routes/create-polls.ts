import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import {z} from "zod";

export async function createPoll(app: FastifyInstance){
    app.post("/poll", async (req, reply) => {
        const createPollBody = z.object({
            title: z.string(),
            options: z.array (z.string()),
        }); //verifica se o body da requisição é um objeto com a chave title e valor string

        const {title, options} = createPollBody.parse(req.body); //retorna o body se ele existir usando o zod

        const poll = await prisma.poll.create({
            data:{
                title,
                options:{
                    createMany: { // Fix: Add a colon after createMany
                        data: options.map(option =>{
                            return { title: option}
                        })
                    }
                },
            }
        });


        return reply.status(201).send({poll_id: poll.id});
    })
};