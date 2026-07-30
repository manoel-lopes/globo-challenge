import { PrimitiveAndDates } from './primitive-and-dates'

export type Props<T> = Omit<PrimitiveAndDates<T>, 'id' | 'createdAt' | 'updatedAt'>
