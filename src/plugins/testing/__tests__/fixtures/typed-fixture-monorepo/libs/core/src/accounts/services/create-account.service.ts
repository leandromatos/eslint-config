import type { CreateAccountDto } from '../dtos/create-account.dto.js'

export const createAccountFromDto = (createAccountDto: CreateAccountDto): string => createAccountDto.name
