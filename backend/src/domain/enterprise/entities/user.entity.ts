import type { Entity } from '@/core/domain/entity'
import type { Props } from '@/shared/types/props'

export type UserProps = Props<User>

export interface User extends Entity {
  name: string
  email: string
  password: string
}
