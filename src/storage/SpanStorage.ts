import {Span} from "@opentelemetry/api";

export class SpanStorage {
    private spans: {[key: string]: Span} = {};

    /**
     * The key is not the id, it's the human-readable key like the PR URL or the JIRA id
     * That said, we still require the key to be unique
     */
    public addSpan(key: string, span: Span) : void {
        this.spans[key] = span;
    }

    public getSpan(key: string): Span | undefined {
        return this.spans[key];
    }
}