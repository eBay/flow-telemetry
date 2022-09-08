import {SpanStorage} from "../storage"
import {getZipkinProvider} from "../opentelemetry/githup-zipkin-provider"
import {Span, Tracer, TracerProvider} from "@opentelemetry/api";
import {Comment, Event, Issue, PullRequest} from "./event-types";

export class GithubEventProcessor {
    private spanStorage: SpanStorage
    private tracer: Tracer

    constructor(spanStorage: SpanStorage, provider: TracerProvider= getZipkinProvider()) {
        this.spanStorage = spanStorage
        this.tracer = provider.getTracer("github")
    }

    public processEvent(event:Event) {
        console.log(`Received github event with action ${event.action}`)
        if (event.pull_request && event.action == "opened") {
            this.processPullRequestOpened(event.pull_request)
        } else if (event.pull_request && event.action == "closed") {
            this.processPullRequestClosed(event.pull_request)
        } else if (event.comment && event.issue && event.action == "created") {
            this.processIssueComment(event.issue, event.comment)
        } else {
            console.log(`Github Event action ${event.action} not recognized or supported`)
        }
    }

    private processPullRequestOpened(pullRequest: PullRequest):void {
        const span:Span = this.tracer.startSpan("Pull Request", {
            "startTime": new Date(pullRequest.created_at),
            "attributes": {
                "url": pullRequest.url,
                "title": pullRequest.title,
                "body": pullRequest.body,
                "user": pullRequest.user.login,
             }});

        this.spanStorage.addSpan(pullRequest.url, span)

        console.log(`Started span for pull request ${pullRequest.url} with trace id ${span.spanContext().traceId}
                     and span id ${span.spanContext().spanId}`)
    }

    private findPullRequestSpan(url:string):Span
        {
        const span:Span|undefined = this.spanStorage.getSpan(url)

        if(!span) {
            // TODO - create span if it doesn't exist, rather than just throw an error
            throw new Error(`Span not found for pull request URL ${url}`)
        }

        return span
    }

    private processPullRequestClosed(pullRequest: PullRequest):void {
        const span:Span = this.findPullRequestSpan(pullRequest.url)

        if (pullRequest.closed_at) {
            span.end(new Date(pullRequest.closed_at))
            console.log(`Ended span for pull request ${pullRequest.url} with span context ${span.spanContext()}`)
        } else {
            throw new Error("Close pull request event does not have closed_at date")
        }
    }

    private processIssueComment(issue: Issue, comment: Comment) {
        const span:Span = this.findPullRequestSpan(issue.url)
        span.addEvent(
            "comment",
            {
                "user": comment.user.login,
                "body": comment.body
            },
        new Date(comment.created_at))
    }
}