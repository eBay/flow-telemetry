export * from './github'
export * from './storage'

import fastify from 'fastify'
import {Event, GithubEventProcessor, SpanStorage} from ".";
import {getJaegerProvider} from "./opentelemetry";

const is_dev = process.platform == 'darwin';

export const server = fastify({
  logger: {
      transport:
      is_dev
        ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
        : undefined
  }
})

server.get('/ping', async (request, reply) => {
  return 'pong\n'
});

const githubEventProcessor: GithubEventProcessor = new GithubEventProcessor(new SpanStorage(), getJaegerProvider())

server.post('/jira/webhook', async(request) => {
  console.log("Got a JIRA webhook call")
  console.log(request.body)
});

server.post('/github/webhook', async (request) => {
  githubEventProcessor.processEvent(request.body as Event)
});

server.listen({ port: 8080, host: "::" }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
