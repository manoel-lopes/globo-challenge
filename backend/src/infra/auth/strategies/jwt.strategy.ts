import { ExtractJwt, Strategy } from 'passport-jwt'
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { EnvService } from '@/infra/env/env.service'

export type JwtPayload = {
  sub: string
  iat: number
  exp: number
}

export type AuthUser = {
  id: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor (envService: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envService.get('JWT_SECRET'),
    })
  }

  validate (payload: JwtPayload): AuthUser {
    return { id: payload.sub }
  }
}
