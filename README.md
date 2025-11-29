# Proyecto de Microservicios con Nx, NestJS y Prisma

Este es un proyecto de ejemplo que demuestra una arquitectura de microservicios utilizando un monorepo Nx, NestJS para los servicios y Prisma para el acceso a la base de datos.

## 1. Prerrequisitos

Asegúrate de tener instalado lo siguiente en tu sistema:

- [Node.js](https://nodejs.org/) (v20 o superior recomendado)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/get-started/) y Docker Compose

## 2. Configuración del Proyecto

### 2.1. Instalación de Dependencias

Clona el repositorio y luego instala todas las dependencias necesarias con `pnpm`.

```bash
pnpm install
```

### 2.2. Configuración del Entorno

El proyecto utiliza un archivo `.env` para gestionar las variables de entorno. Crea un archivo `.env` en la raíz del proyecto copiando el contenido de `.env.example` (si existe) o usando el siguiente como base:

```env
# OpenTelemetry Configuration for SigNoz
OTEL_SERVICE_NAME=microservices
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

## 3. Servicio de Autenticación (api-auth)

El servicio `api-auth` es responsable de la autenticación de usuarios. Provee registro, inicio de sesión, generación y validación de JWT, manejo de refresh tokens y obtención del perfil del usuario.

### Funcionalidades clave
- **Registro de usuarios**: Hash de contraseñas con bcrypt.
- **Login**: Emite un token de acceso (corto) y un refresh token (largo).
- **Validación de token**: Verifica la firma y expiración del JWT.
- **Refresh**: Renueva el token de acceso y rota el refresh token.
- **Perfil**: Devuelve datos del usuario sin la contraseña.

### Variables de entorno requeridas
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please-use-a-strong-random-string
JWT_ACCESS_EXPIRATION=15m   # tiempo de vida del token de acceso
JWT_REFRESH_EXPIRATION=7d   # tiempo de vida del refresh token
```
Asegúrate de definir estas variables en el archivo `.env`.

### Ejecución
```bash
# Desde la raíz del proyecto
pnpm start:dev api-auth
```
Esto iniciará el microservicio de autenticación escuchando en el puerto definido por `PORT_APIAUTH` en el `.env`.

### Endpoints expuestos vía API Gateway
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/validate`
- `GET /auth/profile`

Los endpoints están documentados en Swagger bajo la etiqueta **Auth**.


# Service Ports
PORT_GATEWAY=3000
PORT_APIAUTH=3001
PORT_NETFLIX=3002


pnpm start:all
```

Los servicios se iniciarán en los puertos definidos en tu archivo `.env`.

## 5. Ejecución de Pruebas

### 5.1. E2E del API Gateway

Para ejecutar las pruebas de extremo a extremo (e2e) del `api-gateway`, asegúrate primero de que todos los servicios se estén ejecutando (con `pnpm start:all` en una terminal separada) y luego ejecuta:

```bash
pnpx nx e2e api-gateway-e2e
```

### 5.2. E2E del CSV Processor

Las pruebas E2E de `apps/csv-processor` validan el flujo que dispara el procesamiento del CSV y revisa la base de datos. Requisitos previos:

1. Base de datos y migraciones aplicadas (`pnpm prisma:migrate:dev`).
2. Servicios `api-gateway` y `csv-processor` corriendo (puedes usar `pnpm start:all` o levantar cada uno en terminales separadas con `pnpm start:api-gateway` y `pnpm start:csv-processor`).

Luego ejecuta el script dedicado:

```bash
pnpm test:csv-processor:e2e
```

Este comando usa `nx e2e csv-processor-e2e`, por lo que puedes adaptar los mismos parámetros de Nx si necesitas personalizarlo (por ejemplo, `--watch`).

## 6. Scripts Útiles de Prisma

La gestión del esquema de la base de datos se centraliza en la librería `prisma-client`. Los siguientes scripts están disponibles:

- `pnpm prisma:migrate:dev`: Crea y aplica una nueva migración a partir de los cambios en el `schema.prisma`.
- `pnpm prisma:generate`: (Re)genera el cliente de Prisma después de cambiar el esquema.
- `pnpm prisma:db:pull`: Actualiza el `schema.prisma` para que coincida con el estado actual de la base de datos.

## 6.1. Base de datos Netflix

### Opción automática (recomendado)

1. **Crear la tabla**  
   ```bash
   npx prisma db push --schema=libs/prisma-netflix/prisma/schema.prisma
   ```

2. **Poblar la tabla**  
   ```bash
   npx ts-node --project libs/prisma-netflix/tsconfig.seed.json libs/prisma-netflix/seed.ts
   ```

### Opción manual (psql)

1. **Crear la base de datos (si no existe)**  
   ```bash
   docker exec -it <nombre_contenedor_postgres> createdb -U postgres netflix_shows
   ```

2. **Importar los datos**  
   ```bash
   psql "postgresql://postgres:root@localhost:5432/netflix_shows" -f libs/prisma-netflix/netflix_shows.sql
   ```

> El archivo `netflix_shows.sql` se encuentra en `libs/prisma-netflix/netflix_shows.sql`.

## 7. Documentación de la API

Todas las APIs están disponibles a través del API Gateway con el prefijo `/api`. A continuación se detallan los endpoints disponibles:

### 7.1. Estado de los Servicios

#### Obtener estado de todos los servicios
```bash
curl -X GET http://localhost:3000/api/services/health
```

#### Obtener estado de un servicio específico
```bash
# Para api-auth
curl -X GET http://localhost:3000/api/services/api-auth/health

# Para netflix
curl -X GET http://localhost:3000/api/services/netflix/health
```

### 7.2. Endpoints de Ejemplo

#### Obtener saludo de un servicio
```bash
# Obtener saludo de api-auth
curl -X GET http://localhost:3000/api/services/api-auth/hello

# Obtener saludo de netflix
curl -X GET http://localhost:3000/api/services/netflix/hello
```

#### Probar manejo de errores
```bash
# Generar un error en api-auth
curl -X GET http://localhost:3000/api/services/api-auth/error
```

#### Procesar archivo CSV
```bash
# Procesar archivo CSV y guardar datos en la base de datos
curl -X POST http://localhost:3000/api/csv/process
```

#### Comandos personalizados
```bash
# Enviar comando a un servicio
curl -X POST http://localhost:3000/api/services/api-auth/ejemplo \
  -H "Content-Type: application/json" \
  -d '{"param1": "valor1", "param2": "valor2"}'
```

## 8. Observabilidad (Host Metrics)

Para recolectar métricas del host (CPU, Memoria, Disco, Red) y de la base de datos PostgreSQL, necesitas ejecutar el OpenTelemetry Collector Contrib en tu máquina.

### 8.1. Descarga del OpenTelemetry Collector

1.  Ve a la página de [releases de OpenTelemetry Collector Contrib](https://github.com/open-telemetry/opentelemetry-collector-contrib/releases).
2.  Descarga el binario adecuado para tu sistema operativo (por ejemplo, `otelcol-contrib_0.114.0_windows_amd64.tar.gz` para Windows).
3.  Descomprime el archivo y coloca el ejecutable (`otelcol-contrib.exe` en Windows) en una ubicación de tu elección.

### 8.2. Ejecución del Collector

Una vez que tengas el colector:

#### Windows

1.  Abre PowerShell en la raíz del proyecto.
2.  Ejecuta el siguiente comando, reemplazando `path\to\` con la ruta donde hayas guardado el colector:
    ```powershell
    .\path\to\otelcol-contrib.exe --config signoz-config\collectors\windows\config.yaml
    ```

#### Linux

1.  Abre una terminal en la raíz del proyecto.
2.  Ejecuta el colector usando la configuración proporcionada, reemplazando `path/to/` con la ruta donde hayas guardado el colector:
    ```bash
    ./path/to/otelcol-contrib --config signoz-config/collectors/linux/config.yaml
    ```
    *(Nota: Si ejecutas esto en una máquina diferente a donde corre Signoz, actualiza la IP en `signoz-config/collectors/linux/config.yaml`)*