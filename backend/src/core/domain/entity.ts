import { v7 as uuidv7 } from 'uuid'

export abstract class Entity {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date | null

  protected constructor (id?: string) {
    this.id = id ?? uuidv7()
  }
}
