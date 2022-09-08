import { Resource } from "@opentelemetry/resources";
import {SemanticResourceAttributes} from "@opentelemetry/semantic-conventions"
import {NodeTracerProvider} from "@opentelemetry/sdk-trace-node"
import {BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor} from "@opentelemetry/sdk-trace-base"

const provider = new BasicTracerProvider({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'github-service',
    }),
});

provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

provider.register();

export function getTestingProvider(): NodeTracerProvider {
    return provider;
}