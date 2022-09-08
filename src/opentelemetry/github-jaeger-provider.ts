import { Resource } from "@opentelemetry/resources";
import {SemanticResourceAttributes} from "@opentelemetry/semantic-conventions"
import {NodeTracerProvider} from "@opentelemetry/sdk-trace-node"
import {BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor} from "@opentelemetry/sdk-trace-base"
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new BasicTracerProvider({
    resource: new Resource({
        // TODO make the service name a parameter
        [SemanticResourceAttributes.SERVICE_NAME]: 'github-service',
    }),
});

const exporter = new JaegerExporter({});
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

provider.register();

export function getJaegerProvider(): NodeTracerProvider {
    return provider;
}