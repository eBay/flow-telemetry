# Mapping feature flow concepts to OpenTelemetry
This document describes current thoughts on how we map feature flow behavior (such as creating
tickets, committing code, running jobs) to the flow of an OpenTelemetry tree.

## Identifying the service
Every span of a trace belongs to a _service_. For standard OpenTelemetry tooling, you specify the
service when you start up a service and configure OpenTelemetry with that service name.

In our case the service would be the particular tool or technology that is being used as part of
building a feature and making it available to our users. Example service names would be things like 
"JIRA", "git", "Jenkins", "maven", "kubernetes", "experimentation-platform" and so on.

## Creating a new trace
A new trace is most commonly created when a new ticket is created. This could happen in JIRA,
github issues, or some other tool.

A trace is created when you create a span with no parent.  When you create a span, you provide a 
name. In our case, for the root span, the name should be the ticket identifier (e.g. `RAPTOR-23145`)

When you create a new trace, by default a trace id is generated for you.  This is a 
[16-byte character array](https://opentelemetry.io/docs/reference/specification/trace/api/#:~:text=The%20OpenTelemetry%20SpanContext%20representation%20conforms,least%20one%20non%2Dzero%20byte).

In feature flow, in some cases, humans are responsible for propagating the context. 
So in those cases we need them to be able to identify the parent span. For example, a common 
pattern we see is that a team agrees that every time someone makes a commit, they include the 
ticket id as part of the commit title.  Similar, for a pull request, they include the ticket id 
in the pull request title.

This means that we need the ticket id to be the source of the trace id, not some randomly generated
16-byte value.

It looks like there are APIs that allow us to set the trace id for a new trace, this is still under
investigation. So we can generate a 128-bit hash from the ticket id and use the hex representation of
that as the trace id.

## Creating a new span
A span is identified when a new "step" is taken in the building of that feature.  A sub-task is created,
a github pull request is submitted, a Jenkins job is started. In this case the name of the span would
again be a human-readable unique identifier of the step, such as JIRA ID, the pull request URL
or the commit hash.

OpenTelemetry requires a span id needs to be a unique eight-byte string.  We can again use the 
human-readable identifier of the step to generate a unique 64-bit hash and use that as the span id

## Context propagation in automated tools
Some of the spans are auto-created steps such as running a build or kicking off a deploy, and in some
cases a child span is also automated (such as running a build or running tests as part of a Jenkins job)

In these cases span identification and context propagation needs to be automatic. OpenTelemetry 
has a [proposed standard](https://github.com/open-telemetry/opentelemetry-specification/issues/740#issuecomment-904409379)
to use `TRACEPARENT` and `TRACESTATE` environment variables to propagate context between tools. So
we can use the same approach where possible.
