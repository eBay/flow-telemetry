import { Resource } from "@opentelemetry/resources";
import {SemanticResourceAttributes} from "@opentelemetry/semantic-conventions"
import {NodeTracerProvider} from "@opentelemetry/sdk-trace-node"
import {BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor} from "@opentelemetry/sdk-trace-base"
import {ZipkinExporter} from "@opentelemetry/exporter-zipkin";

const provider = new BasicTracerProvider({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'github-service',
    }),
});

const exporter = new ZipkinExporter({});
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

provider.register();

export function getZipkinProvider(): NodeTracerProvider {
    return provider;
}