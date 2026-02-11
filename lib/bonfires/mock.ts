import { GraphData } from "@/lib/graph/types"

/**
 * Realistic mock graph for development without a live Bonfire API.
 * Models a small community discussion with actors, activities, and tags.
 */
export const MOCK_GRAPH: GraphData = {
  nodes: [
    // Actors
    { id: "actor:1", label: "alice", group: "actor" },
    { id: "actor:2", label: "bob", group: "actor" },
    { id: "actor:3", label: "carol", group: "actor" },
    { id: "actor:4", label: "dave", group: "actor" },

    // Activities
    { id: "activity:101", label: "Post", group: "activity" },
    { id: "activity:102", label: "Reply", group: "activity" },
    { id: "activity:103", label: "Post", group: "activity" },
    { id: "activity:104", label: "Reply", group: "activity" },
    { id: "activity:105", label: "Post", group: "activity" },
    { id: "activity:106", label: "Reply", group: "activity" },
    { id: "activity:107", label: "Post", group: "activity" },
    { id: "activity:108", label: "Reply", group: "activity" },

    // Tags
    { id: "tag:governance", label: "governance", group: "tag" },
    { id: "tag:design", label: "design", group: "tag" },
    { id: "tag:federation", label: "federation", group: "tag" },
    { id: "tag:ux", label: "ux", group: "tag" },
    { id: "tag:moderation", label: "moderation", group: "tag" },
    { id: "tag:accessibility", label: "accessibility", group: "tag" },
  ],
  edges: [
    // Authorship
    { source: "actor:1", target: "activity:101", type: "authored" },
    { source: "actor:2", target: "activity:102", type: "authored" },
    { source: "actor:1", target: "activity:103", type: "authored" },
    { source: "actor:3", target: "activity:104", type: "authored" },
    { source: "actor:2", target: "activity:105", type: "authored" },
    { source: "actor:4", target: "activity:106", type: "authored" },
    { source: "actor:3", target: "activity:107", type: "authored" },
    { source: "actor:4", target: "activity:108", type: "authored" },

    // Replies
    { source: "activity:102", target: "activity:101", type: "replies_to" },
    { source: "activity:104", target: "activity:103", type: "replies_to" },
    { source: "activity:106", target: "activity:105", type: "replies_to" },
    { source: "activity:108", target: "activity:107", type: "replies_to" },

    // Tags
    { source: "activity:101", target: "tag:governance", type: "tagged" },
    { source: "activity:101", target: "tag:federation", type: "tagged" },
    { source: "activity:102", target: "tag:governance", type: "tagged" },
    { source: "activity:103", target: "tag:design", type: "tagged" },
    { source: "activity:103", target: "tag:ux", type: "tagged" },
    { source: "activity:104", target: "tag:design", type: "tagged" },
    { source: "activity:105", target: "tag:moderation", type: "tagged" },
    { source: "activity:105", target: "tag:governance", type: "tagged" },
    { source: "activity:106", target: "tag:moderation", type: "tagged" },
    { source: "activity:107", target: "tag:accessibility", type: "tagged" },
    { source: "activity:107", target: "tag:ux", type: "tagged" },
    { source: "activity:108", target: "tag:accessibility", type: "tagged" },
  ],
}
