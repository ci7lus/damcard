import $ from "transform-ts"

export const GOOGLE_API_KEY = $.string.transformOrThrow(
  process.env.GOOGLE_API_KEY
)
