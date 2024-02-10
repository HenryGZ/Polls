import fastify from "fastify";
import { createPoll } from "./routes/create-polls";
import { getPoll } from "./routes/get-poll";
import { voteOnPoll } from "./routes/vote-on-polls";
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { pollResults } from "./ws/poll-results";

const app = fastify();


app.register(cookie,{
    secret: "my-secret-key", // chave secreta para assinar o cookie
    hook: 'onRequest', // hook para que o cookie seja processado antes de qualquer rota
    parseOptions: {} // opções para o cookie-parser
})
app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)
app.register(websocket)
app.register(pollResults)

app.listen({port : 3333}, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening on ${address}`);
});


