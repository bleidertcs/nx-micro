# API Auth - Servicio de Autenticación

El servicio **api-auth** es responsable de todas las operaciones de autenticación y gestión de usuarios en la arquitectura de microservicios. Implementa registro de usuarios, inicio de sesión, generación y validación de tokens JWT, y manejo de refresh tokens.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Funcionalidades](#funcionalidades)
- [Comandos TCP](#comandos-tcp)
- [Estructura del Código](#estructura-del-código)
- [Configuración](#configuración)
- [Seguridad](#seguridad)
- [JSON Web Tokens (JWT)](#json-web-tokens-jwt)
  - [Implementación Detallada de JWT en `JwtService`](#implementación-detallada-de-jwt-en-jwtservice)
- [Base de Datos](#base-de-datos)

## 🎯 Descripción

El servicio `api-auth` es un microservicio NestJS que:

- Escucha en el puerto **3001** (configurable vía `PORT_APIAUTH`)
- Se comunica vía **TCP** con el API Gateway
- Implementa autenticación basada en **JWT** (JSON Web Tokens)
- Utiliza **bcrypt** para el hash seguro de contraseñas
- Sigue una arquitectura **Clean Architecture** con separación de capas

## 🏗️ Arquitectura

### Clean Architecture

El servicio está organizado siguiendo los principios de Clean Architecture:

```
apps/api-auth/src/
├── domain/                    # Capa de Dominio (sin dependencias externas)
│   ├── entities/              # Entidades de negocio
│   │   └── user.entity.ts
│   └── repositories/          # Interfaces de repositorios
│       └── user.repository.interface.ts
├── application/               # Capa de Aplicación (casos de uso)
│   └── use-cases/
│       ├── register-user.use-case.ts
│       ├── login-user.use-case.ts
│       ├── validate-token.use-case.ts
│       ├── refresh-token.use-case.ts
│       └── get-user-profile.use-case.ts
├── infrastructure/            # Capa de Infraestructura (implementaciones)
│   ├── database/              # Implementación de repositorio con Prisma
│   │   └── prisma-user.repository.ts
│   ├── security/              # Servicios de seguridad
│   │   ├── jwt.service.ts
│   │   └── bcrypt.service.ts
│   └── http/                  # DTOs para comunicación HTTP
│       └── dtos/
├── app/                       # Capa de Presentación (NestJS)
│   ├── app.controller.ts      # Controlador que recibe comandos TCP
│   ├── app.module.ts          # Módulo principal
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── config/                    # Configuración
│   └── envs.ts
└── main.ts                    # Punto de entrada (bootstrap)
```

### Flujo de Dependencias

```mermaid
graph TD
    subgraph "Presentation Layer"
        Main[main.ts]
        Controller[app.controller.ts]
    end
    
    subgraph "Application Layer"
        UC1[RegisterUseCase]
        UC2[LoginUseCase]
        UC3[ValidateUseCase]
        UC4[RefreshUseCase]
        UC5[ProfileUseCase]
    end
    
    subgraph "Domain Layer"
        Entity[User Entity]
        RepoInterface[UserRepository Interface]
    end
    
    subgraph "Infrastructure Layer"
        RepoImpl[PrismaUserRepository]
        JWT[JwtService]
        BC[BcryptService]
        Prisma[Prisma Client]
    end
    
    Main --> Controller
    Controller --> UC1
    Controller --> UC2
    Controller --> UC3
    Controller --> UC4
    Controller --> UC5
    
    UC1 --> RepoInterface
    UC2 --> RepoInterface
    UC3 --> RepoInterface
    UC4 --> RepoInterface
    UC5 --> RepoInterface
    
    UC1 --> BC
    UC2 --> BC
    UC2 --> JWT
    UC3 --> JWT
    UC4 --> JWT
    
    RepoInterface -.->|implementa| RepoImpl
    RepoImpl --> Prisma
    RepoImpl --> Entity
    
    style Domain fill:#e8f5e9,stroke:#4caf50
    style Application fill:#e3f2fd,stroke:#2196f3
    style Infrastructure fill:#fff3e0,stroke:#ff9800
    style Presentation fill:#f3e5f5,stroke:#9c27b0
```

Las dependencias fluyen hacia adentro: la capa de dominio no depende de nada externo.

## ✨ Funcionalidades

### 1. Registro de Usuarios

Permite crear nuevos usuarios en el sistema.

**Comando TCP**: `auth.register`

**Payload**:
```typescript
{
  email: string;
  password: string;
  name: string;
}
```

**Proceso**:

```mermaid
sequenceDiagram
    participant G as Gateway
    participant AC as AppController
    participant RU as RegisterUseCase
    participant BC as BcryptService
    participant UR as UserRepository
    participant DB as Database
    
    G->>AC: TCP {cmd: 'auth.register', data}
    AC->>RU: execute({email, password, name})
    RU->>UR: findByEmail(email)
    UR->>DB: SELECT * FROM users WHERE email = ?
    DB-->>UR: null (no existe)
    UR-->>RU: null
    RU->>BC: hash(password, 10)
    BC-->>RU: hashedPassword
    RU->>UR: create({email, password: hashedPassword, name})
    UR->>DB: INSERT INTO users ...
    DB-->>UR: User
    UR-->>RU: User Entity
    RU->>RU: toJSON() (excluye password)
    RU-->>AC: User Data
    AC-->>G: User Response
```

**Respuesta**:
```typescript
{
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Inicio de Sesión (Login)

Autentica usuarios y genera tokens JWT.

**Comando TCP**: `auth.login`

**Payload**:
```typescript
{
  email: string;
  password: string;
}
```

**Proceso**:

```mermaid
sequenceDiagram
    participant G as Gateway
    participant AC as AppController
    participant LU as LoginUseCase
    participant UR as UserRepository
    participant BC as BcryptService
    participant JS as JwtService
    participant DB as Database
    
    G->>AC: TCP {cmd: 'auth.login', {email, password}}
    AC->>LU: execute({email, password})
    LU->>UR: findByEmail(email)
    UR->>DB: SELECT * FROM users WHERE email = ?
    DB-->>UR: User
    UR-->>LU: User Entity
    LU->>BC: compare(password, user.password)
    BC-->>LU: true/false
    alt Password Valid
        LU->>JS: generateAccessToken({sub, email})
        JS-->>LU: accessToken (15m)
        LU->>JS: generateRefreshToken({sub, email})
        JS-->>LU: refreshToken (7d)
        LU->>UR: saveRefreshToken(userId, refreshToken, expiry)
        UR->>DB: INSERT INTO refresh_tokens ...
        DB-->>UR: Success
        LU->>LU: toJSON() (excluye password)
        LU-->>AC: {accessToken, refreshToken, user}
        AC-->>G: Login Response
    else Password Invalid
        LU-->>AC: UnauthorizedException
        AC-->>G: Error 401
    end
```

**Respuesta**:
```typescript
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

### 3. Validación de Token

Verifica si un token JWT es válido.

**Comando TCP**: `auth.validate`

**Payload**:
```typescript
{
  token: string;
}
```

**Proceso**:
1. Verifica la firma del token usando el secreto JWT
2. Verifica que el token no haya expirado
3. Extrae el payload (user ID, email)
4. Opcionalmente verifica que el usuario exista

**Respuesta**:
```typescript
{
  valid: boolean;
  user?: {
    id: string;
    email: string;
  };
}
```

### 4. Refresh de Token

Renueva el access token usando un refresh token válido.

**Comando TCP**: `auth.refresh`

**Payload**:
```typescript
{
  refreshToken: string;
}
```

**Proceso**:
1. Verifica que el refresh token sea válido
2. Verifica que el refresh token exista en la base de datos
3. Genera un nuevo access token
4. Opcionalmente rota el refresh token (genera uno nuevo)
5. Retorna los nuevos tokens

**Respuesta**:
```typescript
{
  accessToken: string;
  refreshToken?: string;  // Solo si se rota
}
```

### 5. Obtener Perfil de Usuario

Retorna los datos del perfil de un usuario autenticado.

**Comando TCP**: `auth.profile`

**Payload**:
```typescript
{
  userId: string;
}
```

**Proceso**:
1. Busca el usuario por ID
2. Retorna los datos del usuario (sin contraseña)

**Respuesta**:
```typescript
{
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔌 Comandos TCP

El servicio expone los siguientes comandos TCP que pueden ser invocados desde el API Gateway:

| Comando | Descripción | Payload |
|---------|-------------|---------|
| `auth.register` | Registrar nuevo usuario | `{ email, password, name }` |
| `auth.login` | Iniciar sesión | `{ email, password }` |
| `auth.validate` | Validar token JWT | `{ token }` |
| `auth.refresh` | Refrescar access token | `{ refreshToken }` |
| `auth.profile` | Obtener perfil de usuario | `{ userId }` |

### Ejemplo de Uso desde API Gateway

```typescript
// En el API Gateway
@Post('login')
async login(@Body() dto: LoginUserDto) {
  return firstValueFrom(
    this.authService.send({ cmd: 'auth.login' }, dto)
  );
}
```

## 📁 Estructura del Código

### Casos de Uso (Use Cases)

Los casos de uso encapsulan la lógica de negocio:

- **RegisterUserUseCase**: Lógica de registro
- **LoginUserUseCase**: Lógica de autenticación
- **ValidateTokenUseCase**: Validación de tokens
- **RefreshTokenUseCase**: Renovación de tokens
- **GetUserProfileUseCase**: Obtención de perfil

### Repositorio

El repositorio abstrae el acceso a datos:

**Interfaz** (`domain/repositories/user.repository.interface.ts`):
```typescript
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(userData: CreateUserData): Promise<User>;
  saveRefreshToken(userId: string, token: string, expiry: Date): Promise<void>;
  // ...
}
```

**Implementación** (`infrastructure/database/prisma-user.repository.ts`):
- Implementa la interfaz usando Prisma
- Maneja la persistencia en PostgreSQL

### Servicios de Seguridad

- **JwtService**: Generación y verificación de tokens JWT
- **BcryptService**: Hash y comparación de contraseñas

## ⚙️ Configuración

### Variables de Entorno

Agrega al archivo `.env` en la raíz del proyecto:

```env
# Puerto del servicio
PORT_APIAUTH=3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please-use-a-strong-random-string
JWT_ACCESS_EXPIRATION=15m    # Tiempo de vida del access token
JWT_REFRESH_EXPIRATION=7d    # Tiempo de vida del refresh token

# Base de Datos
DATABASE_URL=postgresql://postgres:root@localhost:5432/test_micro?schema=public

# OpenTelemetry
OTEL_SERVICE_NAME=api-auth
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

### Configuración de JWT

Los tokens JWT se configuran en `apps/api-auth/src/config/envs.ts`:

```typescript
export const envs = {
  jwtSecret: process.env.JWT_SECRET!,
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  // ...
};
```

## 🔒 Seguridad

### 1. Hash de Contraseñas

Las contraseñas se hashean usando **bcrypt** con 10 rounds:

```typescript
// Al registrar
const hashedPassword = await bcrypt.hash(password, 10);

// Al verificar
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. Tokens JWT

- **Access Token**: Corta duración (15 minutos) para reducir el impacto de tokens comprometidos
- **Refresh Token**: Larga duración (7 días) almacenado en base de datos para poder revocarlo
- **Secreto**: Debe ser una cadena aleatoria fuerte (256 bits recomendado)

### 3. Validación de Inputs

Todos los DTOs se validan usando `class-validator`:
- Email debe ser válido
- Contraseña debe cumplir requisitos mínimos
- Campos requeridos se validan

### 4. Manejo de Errores

Los errores se manejan de forma segura:
- No se revela si un email existe o no (evita enumeración)
- Mensajes de error genéricos para credenciales inválidas

## 🔑 JSON Web Tokens (JWT)

Un JSON Web Token (JWT) es un estándar abierto (RFC 7519) que define una forma compacta y autónoma de transmitir información de manera segura entre partes como un objeto JSON. Esta información puede ser verificada y confiable porque está firmada digitalmente. Los JWT pueden ser firmados utilizando un secreto (con el algoritmo HMAC) o un par de claves pública/privada (usando RSA o ECDSA).

### Estructura de un JWT

Un JWT consta de tres partes principales, separadas por puntos: **Encabezado**, **Carga útil** y **Firma**.

1.  **Encabezado (Header):**
    Contiene metadatos sobre el token, incluyendo el tipo de token (JWT) y el algoritmo de firma utilizado (`alg`).

    ```json
    {
      "alg": "HS256",
      "typ": "JWT"
    }
    ```

    Aquí, `"alg"` indica el algoritmo de firma (en este caso, HMAC SHA-256) y `"typ"` especifica que es un JWT.

2.  **Carga útil (Payload):**
    Contiene las afirmaciones (claims), que son declaraciones sobre una entidad (generalmente, el usuario) y datos adicionales. Existen tres tipos de claims:
    *   **Claims Registrados:** Un conjunto de claims predefinidos, no obligatorios pero recomendados. Ejemplos comunes son:
        *   `iss` (Issuer): Emisor del token.
        *   `sub` (Subject): Sujeto del token (por ejemplo, el ID del usuario).
        *   `aud` (Audience): Destinatario del token.
        *   `exp` (Expiration Time): Tiempo de expiración del token.
        *   `iat` (Issued At): Marca de tiempo de emisión del token.
    *   **Claims Públicos:** Pueden ser definidos por los usuarios y deben ser únicos para evitar colisiones.
    *   **Claims Privados:** Son personalizados y acordados entre las partes que intercambian la información.

    Ejemplo de carga útil:

    ```json
    {
      "sub": "1234567890",
      "name": "John Doe",
      "admin": true,
      "iat": 1516239022
    }
    ```

3.  **Firma (Signature):**
    Para crear la firma, se toma el encabezado y la carga útil, se codifican en Base64Url, se concatenan con un punto, y se firma con un secreto (para HMAC) o una clave privada (para RSA/ECDSA) utilizando el algoritmo especificado en el encabezado. Esto asegura que el token no haya sido alterado.

    La firma se calcula de la siguiente manera:

    ```
    HMACSHA256(
      base64UrlEncode(header) + "." +
      base64UrlEncode(payload),
      secret
    )
    ```

    El JWT final se ve así: `xxxxx.yyyyy.zzzzz`

### Funcionamiento de un JWT

1.  **Autenticación:** Cuando un usuario inicia sesión con sus credenciales (usuario y contraseña), el servidor verifica la autenticidad de las mismas.
2.  **Generación del JWT:** Si las credenciales son válidas, el servidor genera un JWT. Este token incluye información relevante sobre el usuario (claims) y establece un tiempo de expiración.
3.  **Envío del JWT al cliente:** El servidor envía el JWT al cliente. El cliente lo almacena (por ejemplo, en la memoria del navegador, `localStorage`, o en una cookie segura).
4.  **Uso del JWT:** En cada solicitud subsiguiente al servidor, el cliente envía el JWT, generalmente en el encabezado de autorización:

    ```
    Authorization: Bearer <token>
    ```

5.  **Verificación y Validación del JWT:** El servidor recibe el JWT en cada solicitud protegida. Antes de confiar en su contenido, realiza varios pasos cruciales:
    *   **Verificación de Firma:** Utiliza el secreto compartido (para HMAC) o la clave pública (para RSA/ECDSA) para recalcular la firma del token y la compara con la firma original presente en el JWT. Si las firmas no coinciden, el token ha sido alterado o es inválido, y se rechaza. Esto garantiza la **integridad** del token.
    *   **Validación de Claims:** Además de la firma, se validan los claims registrados. Los más importantes son:
        *   `exp` (Expiration Time): Se verifica que el token no haya expirado. Si la fecha actual es posterior a `exp`, el token se considera caducado y se rechaza.
        *   `nbf` (Not Before): Opcionalmente, se verifica que el token no sea utilizado antes de un tiempo específico.
        *   `iss` (Issuer) y `aud` (Audience): Se puede verificar que el emisor del token sea el esperado y que el token esté destinado a la audiencia correcta, lo que añade otra capa de seguridad.
    Si todas las verificaciones y validaciones son exitosas, el servidor confía en la información del payload y procesa la solicitud.

### Ventajas de Usar JWT

*   **Compacto:** Debido a su formato JSON y codificación en Base64Url, los JWT son compactos y pueden ser fácilmente transmitidos en URLs, encabezados HTTP y cookies.
*   **Autónomo:** Contienen toda la información necesaria sobre el usuario, lo que puede eliminar la necesidad de consultar una base de datos en cada solicitud para obtener detalles básicos del usuario.
*   **Seguro:** Al estar firmados digitalmente, la integridad de los datos está garantizada, lo que significa que el servidor puede confiar en que el contenido del token no ha sido alterado desde su emisión. Pueden ser cifrados para mayor seguridad, aunque la firma ya proporciona integridad.

### Consideraciones de Seguridad

*   **Almacenamiento Seguro:** Es fundamental almacenar los JWT de manera segura en el cliente (por ejemplo, en `HttpOnly` cookies para proteger contra ataques XSS).
*   **Expiración y Renovación:**
    *   **Tokens de Acceso (Access Tokens):** Deben tener una **corta duración** (minutos u horas). Esto minimiza el riesgo si un access token es interceptado, ya que su ventana de utilidad es limitada. Una vez que expira, el cliente debe obtener uno nuevo.
    *   **Tokens de Refresco (Refresh Tokens):** Tienen una **vida útil más larga** (días o semanas) y se utilizan para obtener nuevos access tokens sin requerir que el usuario vuelva a iniciar sesión con sus credenciales. Los refresh tokens deben ser almacenados de forma segura en el servidor y pueden ser **revocados** si se sospecha un compromiso. La implementación de un mecanismo de rotación de refresh tokens (donde cada vez que se usa uno, se emite uno nuevo y el anterior se invalida) añade una capa extra de seguridad.
    Establecer tiempos de expiración adecuados y mecanismos para renovar tokens ayuda a mitigar riesgos en caso de que un token sea comprometido.
*   **Uso de HTTPS:** Siempre utilizar HTTPS para transmitir JWTs y protegerlos contra ataques de intermediarios (Man-in-the-Middle).
*   **Secreto Fuerte:** Utilizar un secreto de firma fuerte y complejo que no sea fácil de adivinar o `bruteforcear`.

### Implementación Detallada de JWT en `JwtService`

El servicio `JwtService` (ubicado en `apps/api-auth/src/infrastructure/security/jwt.service.ts`) es el encargado de la generación y verificación de los JSON Web Tokens en la aplicación. Utiliza la librería `@nestjs/jwt` para abstraer la complejidad de la gestión de JWT.

```typescript
import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { envs } from '../../config/envs';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: envs.jwtSecret,
      expiresIn: envs.jwtAccessExpiration as any,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: envs.jwtSecret,
      expiresIn: envs.jwtRefreshExpiration as any,
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: envs.jwtSecret,
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: envs.jwtSecret,
    });
  }
}
```

#### Componentes Clave:

*   **`JwtPayload` Interfaz:**
    Define la estructura mínima del `payload` que se incluirá en nuestros tokens. Contiene `sub` (subject, que típicamente es el ID del usuario) y `email`.

    ```typescript
    export interface JwtPayload {
      sub: string;
      email: string;
    }
    ```

*   **Constructor:**
    El servicio inyecta `NestJwtService` de `@nestjs/jwt`, que es la implementación base que proporciona NestJS para trabajar con JWT.

    ```typescript
    constructor(private readonly jwtService: NestJwtService) {}
    ```

*   **`generateAccessToken(payload: JwtPayload): string`:**
    Este método es responsable de crear un **Access Token**. Recibe un `payload` (`JwtPayload`) y lo firma utilizando:
    *   `secret: envs.jwtSecret`: La clave secreta para firmar el token, obtenida de las variables de entorno para mayor seguridad.
    *   `expiresIn: envs.jwtAccessExpiration`: El tiempo de expiración del access token, también configurado en las variables de entorno. Los access tokens suelen tener una duración corta (e.g., 15 minutos).

    ```typescript
    generateAccessToken(payload: JwtPayload): string {
      return this.jwtService.sign(payload, {
        secret: envs.jwtSecret,
        expiresIn: envs.jwtAccessExpiration as any,
      });
    }
    ```

*   **`generateRefreshToken(payload: JwtPayload): string`:**
    Similar al `generateAccessToken`, pero este método crea un **Refresh Token**. La diferencia principal es que `expiresIn` se configura con `envs.jwtRefreshExpiration`, que suele ser un período de tiempo más largo (e.g., 7 días) para permitir a los usuarios obtener nuevos access tokens sin tener que volver a iniciar sesión con sus credenciales.

    ```typescript
    generateRefreshToken(payload: JwtPayload): string {
      return this.jwtService.sign(payload, {
        secret: envs.jwtSecret,
        expiresIn: envs.jwtRefreshExpiration as any,
      });
    }
    ```

*   **`verifyAccessToken(token: string): JwtPayload`:**
    Este método se encarga de **verificar y validar** un access token. Recibe el token como una cadena y realiza las siguientes comprobaciones:
    *   **Verificación de Firma:** Utiliza el `envs.jwtSecret` para verificar que la firma del token sea auténtica y que el token no haya sido manipulado.
    *   **Validación de Expiración:** Comprueba automáticamente el claim `exp` (expiration time) del token. Si el token ha expirado, este método lanzará una excepción.
    Si el token es válido y no ha expirado, devuelve el `payload` original (`JwtPayload`) contenido en el token.

    ```typescript
    verifyAccessToken(token: string): JwtPayload {
      return this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });
    }
    ```

*   **`verifyRefreshToken(token: string): JwtPayload`:**
    Funciona de manera idéntica a `verifyAccessToken`, pero está diseñado para validar refresh tokens. También verifica la firma y la expiración del token utilizando el mismo secreto, pero considerando la duración más larga del refresh token.

    ```typescript
    verifyRefreshToken(token: string): JwtPayload {
      return this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });
    }
    ```

Esta implementación proporciona las funcionalidades esenciales para un sistema de autenticación basado en JWT, gestionando la emisión y la validación de tokens de acceso y de refresco con tiempos de vida configurables.

## 💾 Base de Datos

### Esquema de Usuario

El servicio utiliza la base de datos `test_micro` con el siguiente esquema (definido en `libs/prisma-client/prisma/schema.prisma`):

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  name          String
  refreshToken  String?
  refreshTokenExpiry DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Migraciones

Para aplicar migraciones:

```bash
pnpm prisma:migrate:dev
```

Para regenerar el cliente Prisma:

```bash
pnpm prisma:generate
```

## 🚀 Ejecución

### Desarrollo

```bash
# Desde la raíz del proyecto
pnpm start:api-auth

# O usando Nx directamente
nx serve api-auth
```

### Producción

```bash
# Build
pnpm build:api-auth

# Ejecutar build
node dist/apps/api-auth/main.js
```

## 🧪 Testing

### Tests E2E

```bash
pnpm test:api-auth:e2e
```

**Requisitos**:
- Base de datos configurada y migrada
- API Gateway corriendo (para tests de integración)

## 📊 Observabilidad

El servicio está instrumentado con OpenTelemetry:

- **Traces**: Todas las operaciones se rastrean
- **Metrics**: Métricas de autenticación (intentos de login, registros, etc.)
- **Logs**: Logs estructurados con Winston

**Ver en SigNoz**: http://localhost:8080

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Documentación de JWT](https://jwt.io/)
- [DeepWiki - Authentication Service](https://deepwiki.com/bleidertcs/nx-micro/7-authentication-service)

