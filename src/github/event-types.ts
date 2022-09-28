export interface User {
    login: string
}

export interface Review {
    submitted_at: string
    commit_id: string
    state: string
    user: User
}

export interface PullRequest {
    title: string
    url: string
    state: string
    created_at: string
    closed_at?: string
    user: User
    body: string
    repo: {
        full_name: string
        html_url: string
    }
}

export interface Comment {
    url: string
    created_at: string
    body: string;
    user: User
}

export interface Issue {
    title: string
    url: string
    state: string
}

export interface PullRequestReview {
    action: string
    review: Review
    pull_request: PullRequest        

}

export interface Event {
    action: string
    pull_request?: PullRequest
    review?: PullRequestReview
    issue?: Issue
    comment?: Comment
}