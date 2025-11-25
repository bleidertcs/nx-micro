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

# Service Ports
PORT_GATEWAY=3000
PORT_SERVICE1=3001
PORT_SERVICE2=3002

# Database Configuration
DATABASE_URL="postgresql://postgres:root@localhost:5432/test_micro?schema=public"
```

**Importante:** Asegúrate de que la `DATABASE_URL` coincida con la configuración de tu base de datos.

## 3. Base de Datos

### 3.1. Iniciar la Base de Datos

El proyecto incluye un archivo `docker-compose.yaml` para levantar fácilmente una base de datos PostgreSQL y otros servicios como SigNoz para observabilidad.

Para iniciar la base de datos y los demás servicios en contenedores, ejecuta:

```bash
docker-compose up -d
```

### 3.2. Aplicar Migraciones

Una vez que la base de datos esté en funcionamiento, necesitas aplicar las migraciones del esquema de Prisma para crear las tablas necesarias.

```bash
pnpm prisma:migrate:dev
```

Este comando leerá el esquema centralizado en `libs/prisma-client` y actualizará la base de datos.

## 4. Ejecución de la Aplicación

Para iniciar todos los microservicios (api-gateway, service1, service2) simultáneamente, ejecuta:

```bash
pnpm start:all
```

Los servicios se iniciarán en los puertos definidos en tu archivo `.env`.

## 5. Ejecución de Pruebas

Para ejecutar las pruebas de extremo a extremo (e2e), que validan el flujo completo a través del `api-gateway`, asegúrate primero de que todos los servicios se estén ejecutando (con `pnpm start:all` en una terminal separada) y luego ejecuta:

```bash
pnpx nx e2e api-gateway-e2e
```

## 6. Scripts Útiles de Prisma

La gestión del esquema de la base de datos se centraliza en la librería `prisma-client`. Los siguientes scripts están disponibles:

- `pnpm prisma:migrate:dev`: Crea y aplica una nueva migración a partir de los cambios en el `schema.prisma`.
- `pnpm prisma:generate`: (Re)genera el cliente de Prisma después de cambiar el esquema.
- `pnpm prisma:db:pull`: Actualiza el `schema.prisma` para que coincida con el estado actual de la base de datos.

## 7. Observabilidad (Host Metrics)

Para recolectar métricas del host (CPU, Memoria, Disco, Red) y de la base de datos PostgreSQL, necesitas ejecutar el OpenTelemetry Collector Contrib en tu máquina.

### 7.1. Descarga del OpenTelemetry Collector

1.  Ve a la página de [releases de OpenTelemetry Collector Contrib](https://github.com/open-telemetry/opentelemetry-collector-contrib/releases).
2.  Descarga el binario adecuado para tu sistema operativo (por ejemplo, `otelcol-contrib_0.114.0_windows_amd64.tar.gz` para Windows).
3.  Descomprime el archivo y coloca el ejecutable (`otelcol-contrib.exe` en Windows) en una ubicación de tu elección.

### 7.2. Ejecución del Collector

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