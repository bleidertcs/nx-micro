# shared-dtos

Librería compartida que proporciona DTOs (Data Transfer Objects) de autenticación utilizados en múltiples servicios del monorepo.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [DTOs Disponibles](#-dtos-disponibles)
- [Uso](#-uso)
- [Beneficios](#-beneficios)

## 🎯 Descripción

La librería `@nx-microservices/shared-dtos` centraliza los DTOs de autenticación que son compartidos entre el API Gateway y los microservicios de autenticación. Esto elimina duplicación de código y asegura consistencia en las validaciones y documentación de API.

## 📦 DTOs Disponibles

### LoginUserDto

DTO para autenticación de usuarios.

**Campos:**

- `email` (string, required): Email del usuario
- `password` (string, required): Contraseña del usuario

**Validaciones:**

- Email debe ser válido
- Todos los campos son requeridos

### RegisterUserDto

DTO para registro de nuevos usuarios.

**Campos:**

- `email` (string, required): Email del usuario
- `password` (string, required): Contraseña (mínimo 8 caracteres)
- `name` (string, required): Nombre completo del usuario

**Validaciones:**

- Email debe ser válido
- Password debe tener al menos 8 caracteres
- Todos los campos son requeridos

### RefreshTokenDto

DTO para renovación de tokens de acceso.

**Campos:**

- `refreshToken` (string, required): Token de refresh JWT

**Validaciones:**

- Token es requerido

### ValidateTokenDto

DTO para validación de tokens JWT.

**Campos:**

- `token` (string, required): Token JWT a validar

**Validaciones:**

- Token es requerido

## 🚀 Uso

### Importar DTOs

```typescript
import { LoginUserDto, RegisterUserDto, RefreshTokenDto, ValidateTokenDto } from '@nx-microservices/shared-dtos';
```

### Usar en Controladores

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from '@nx-microservices/shared-dtos';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    // Implementación
  }

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    // Implementación
  }
}
```

### Documentación Swagger

Todos los DTOs incluyen decoradores `@ApiProperty` para generar documentación Swagger automáticamente:

```typescript
@ApiProperty({
  example: 'user@example.com',
  description: 'User email address',
})
@IsEmail()
@IsNotEmpty()
email!: string;
```

## ✨ Beneficios

1. **Single Source of Truth**: Los DTOs están definidos en un solo lugar
2. **Consistencia**: Mismas validaciones en todos los servicios
3. **Mantenibilidad**: Cambios en un solo lugar se reflejan en todos los servicios
4. **Type Safety**: TypeScript garantiza tipos consistentes
5. **Documentación**: Swagger documentation generada automáticamente

## 🔗 Servicios que Usan esta Librería

- **api-gateway**: Controllers de autenticación
- **api-auth**: Interfaces de use cases (usan interfaces locales pero compatible con estos DTOs)

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de class-validator](https://github.com/typestack/class-validator)
- [Documentación de Swagger](https://docs.nestjs.com/openapi/introduction)
