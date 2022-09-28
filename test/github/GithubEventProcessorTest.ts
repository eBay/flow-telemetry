import {
    Comment,
    Event,
    GithubEventProcessor, Issue, PullRequest, PullRequestReview, SpanStorage
} from '../../src/'

import * as assert from "assert";
import {Attributes, HrTime, Span} from "@opentelemetry/api";
import base, {TimedEvent} from "@opentelemetry/sdk-trace-base";
import {getTestingProvider} from "../testing-tracing-provider";

const openPullRequestEvent: Event = require('./data/pull-request-opened.json')
const closePullRequestEvent: Event = require('./data/pull-request-closed.json')
const commentEvent: Event = require('./data/issue-comment-added.json')
const pullRequestReviewEvent: Event = require('./data/pull-request-review-submitted.json')

const spanStorage = new SpanStorage()
const eventProcessor = new GithubEventProcessor(spanStorage, getTestingProvider())

function assertTimestampMatchesHrtime(timestamp: string, hrTime: HrTime): void {
    const createdAtEpoch: number = new Date(timestamp).getTime()
    assert.equal(createdAtEpoch / 1000, hrTime[0])
    assert.equal(createdAtEpoch % 1000, hrTime[1])
}

describe('Github Event Processor', () => {
    describe('Pull Request Events', () => {
        describe('Open Pull Request', () => {
            let openPullRequest:PullRequest
            beforeEach(() => {
                if (!openPullRequestEvent.pull_request) {
                    assert.fail("pull request object missing")
                } else {
                    openPullRequest = openPullRequestEvent.pull_request
                    eventProcessor.processEvent(openPullRequestEvent)
                }
            })

            function isValidHexString(value: string, len: number): boolean {
                const re = new RegExp(`[0-9A-Fa-f]{${len}}`, "g");

                return re.test(value)
            }

            it('it should create a new pull request span', () => {
                const span: Span | undefined = spanStorage.getSpan(openPullRequest.url)
                assert.equal(true, span != undefined, "span was not found")
            })


            it('it should start the span using the pull request created time', () => {
                const span: Span | undefined = spanStorage.getSpan(openPullRequest.url)
                assertTimestampMatchesHrtime(openPullRequest.created_at, (<base.Span>span).startTime)
            })

            it('it should create a valid span context', () => {
                const span: Span | undefined = spanStorage.getSpan(openPullRequest.url)
                if (!span) {
                    assert.fail('span not found')
                } else {
                    assert.equal(true, isValidHexString(span.spanContext().traceId, 32), "traceId is not a valid hex string")
                    assert.equal(true, isValidHexString(span.spanContext().spanId, 16), "traceId is not a valid hex string")
                }
            })

            it("it should have the correct attributes", () => {
                const span: Span | undefined = spanStorage.getSpan(openPullRequest.url)
                if (!span) {
                    assert.fail('span not found')
                } else {
                    const baseSpan: base.Span = <base.Span>span
                    const attributes = baseSpan.attributes

                    assert.equal(openPullRequest.url, attributes.url)
                    assert.equal(openPullRequest.title, attributes.title)
                    assert.equal(openPullRequest.body, attributes.body)
                    assert.equal(openPullRequest.user.login, attributes.user)
                }
            })
        })

        describe('Add Pull Request Comment', () => {
            let pullRequestSpan: base.Span
            let issue: Issue
            let comment: Comment

            beforeEach(() => {
                if (!commentEvent.issue) {
                    assert.fail("issue is undefined")
                } else if (!commentEvent.comment) {
                    assert.fail("comment is missing")
                } else {
                    issue = commentEvent.issue
                    comment = commentEvent.comment
                }
                eventProcessor.processEvent(openPullRequestEvent)
                eventProcessor.processEvent(commentEvent)

                const span: Span | undefined = spanStorage.getSpan(issue.url)
                if (!span) {
                    assert.fail('span not found for url' + issue.url)
                }
                pullRequestSpan = <base.Span>span
            })

            function findCommentEvent(): TimedEvent {
                const events = pullRequestSpan.events
                const event: TimedEvent | undefined = events.find(e => e.name === 'comment')
                if (!event) {
                    assert.fail('event for issue comment not found')
                }

                return event
            }

            it('Adds the comment as a span event on the pull request', () => {
                findCommentEvent()
            })

            it('Uses the created_at field as the time of the event', () => {
                const event: TimedEvent = findCommentEvent()
                assertTimestampMatchesHrtime(comment.created_at, event.time)
            })

            it('Adds useful attributes to the comment event', () => {
                const event: TimedEvent = findCommentEvent()
                const attributes:Attributes|undefined = event.attributes
                if (!attributes) {
                    assert.fail("No attributes defined")
                }
                assert.equal(attributes.user, comment.user.login)
                assert.equal(attributes.body, comment.body)
            })
        })
        describe('Add PR Review', () => {
            let pullRequestSpan: base.Span
            let pullRequestReview: PullRequestReview

            beforeEach(() => {
                if (!pullRequestReviewEvent.review) {
                    assert.fail("review is missing")
                } else {
                    pullRequestReview = pullRequestReviewEvent.review
                }
                eventProcessor.processEvent(openPullRequestEvent)
                eventProcessor.processEvent(pullRequestReviewEvent)

                const pullRequest = pullRequestReviewEvent.pull_request
                if (!pullRequest) {
                    assert.fail("pull request is missing")
                }

                const span: Span | undefined = spanStorage.getSpan(pullRequest.url)
                if (!span) {
                    assert.fail('span not found for url ' + pullRequest.url)
                }
                pullRequestSpan = <base.Span>span
            })

            function findReviewEvent(): TimedEvent {
                const events = pullRequestSpan.events
                const event: TimedEvent | undefined = events.find(e => e.name === 'review')
                if (!event) {
                    assert.fail('event for pull request review not found')
                }

                return event
            }

            it('Adds the review as a span event on the pull request', () => {
                findReviewEvent()
            })

            it('Uses the submitted_at field as the time of the event', () => {
                const event: TimedEvent = findReviewEvent()
                assertTimestampMatchesHrtime(pullRequestReview.review.submitted_at, event.time)
            })

            it('Adds useful attributes to the review event', () => {
                const event: TimedEvent = findReviewEvent()
                const attributes:Attributes|undefined = event.attributes
                if (!attributes) {
                    assert.fail("No attributes defined")
                }
                assert.equal(attributes.user, pullRequestReview.review.user.login)
                assert.equal(attributes.state, pullRequestReview.review.state)
            })
        })

        describe('Close Pull Request', () => {
            let closePullRequest: PullRequest

            if (!closePullRequestEvent.pull_request) {
                assert.fail('pull request is undefined')
            } else {
                closePullRequest = closePullRequestEvent.pull_request
            }

            beforeEach(() => {
                eventProcessor.processEvent(openPullRequestEvent)
                eventProcessor.processEvent(closePullRequestEvent)
            })

            it('it should close the pull request span', () => {
                const span: Span | undefined = spanStorage.getSpan(closePullRequest.url)
                if (!span) {
                    assert.fail("Span not found")
                } else {
                    const baseSpan: base.Span = <base.Span>span
                    assert.equal(true, baseSpan.ended, "span not marked as ended")
                }
            })

            it('it should use the pull request close time as the span end time', () => {
                const span: Span | undefined = spanStorage.getSpan(closePullRequest.url)
                if (!span) {
                    assert.fail("Span not found")
                } else if (!closePullRequest.closed_at) {
                    assert.fail("Closed time not set on close pull request event")
                } else {
                    assertTimestampMatchesHrtime(closePullRequest.closed_at, (<base.Span>span).endTime)
                }
            })
        })
    })
})