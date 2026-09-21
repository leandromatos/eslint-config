/** The messages `e2e-over-http` reports. */
export type E2eOverHttpMessageId = 'noRequest'

/** The test kind that goes through HTTP, and the module it sends requests with. */
export interface HttpTest {
  /** The test kind that goes through HTTP, such as `e2e`. */
  kind: string
  /** The module a spec of that kind imports to send a request, such as `supertest`. */
  client: string
}
