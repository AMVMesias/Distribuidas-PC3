# Evaluación Conjunta

## 1. Contexto

**CavaLocal** es un marketplace intermediario de vinos para Caracas. Actualmente cuenta con un **backend en NestJS** (API REST), un **frontend web** en vanilla JS y un **landing de marketing**. Dado el crecimiento del proyecto, se requiere implementar una trazabilidad completa mediante un **microservicio de auditoría** desacoplado y un **dashboard en tiempo real** que visualice estos eventos mediante **Server-Sent Events (SSE)**.

El gran desafío de esta actividad es que todo el ecosistema —backend principal, microservicio de auditoría, base de datos, RabbitMQ y dashboard— debe ser **contenedorizado con Docker** y **orquestado en Kubernetes** para simular un entorno de producción escalable y resiliente.

## 2. Objetivo general

Diseñar, implementar, desplegar y orquestar en Kubernetes un microservicio de auditoría que consuma eventos del backend principal vía RabbitMQ, los almacene y exponga un dashboard SSE para monitorización en tiempo real.

## 3. Alcance

- **Backend (NestJS):** debe publicar mensajes en RabbitMQ por cada acción de escritura sobre las entidades del sistema: vinos, tiendas, usuarios, reservas y pagos.
- **Microservicio de auditoría:** consume los mensajes, almacena la traza —entidad, acción, usuario, fecha y datos JSON— y expone una API REST para consultas.
- **Dashboard SSE:** consume un endpoint SSE —expuesto por el microservicio o por un servicio adjunto— y actualiza la interfaz en tiempo real.
- **Despliegue:** todo el sistema debe desplegarse en un clúster de Kubernetes, ya sea local con Minikube o Kind, o en la nube.

## 4. Requisitos funcionales

### 4.1. Microservicio de auditoría

- **Registro:** almacena entidad, acción, usuario —ID o correo electrónico—, timestamp y datos JSON. En las actualizaciones debe registrar el estado anterior y el posterior.
- **API de consulta:** endpoints REST con paginación y filtros por entidad, usuario, fecha y acción.
- **Consumo asíncrono:** escucha la cola de RabbitMQ y confirma el mensaje únicamente después de persistirlo exitosamente mediante **ACK manual**.

### 4.2. Dashboard en tiempo real (SSE)

- Visualiza la lista de auditorías recientes con actualización automática.
- Permite filtrar por entidad, acción y usuario.
- Muestra el detalle completo del JSON al hacer clic en un evento.
- Implementa reconexión automática ante caídas del SSE.

### 4.3. Integración con el backend actual (NestJS)

- Modificar los servicios `create`, `update` y `delete` para que publiquen un mensaje estructurado en el exchange `audit.events` de RabbitMQ.
- El mensaje debe incluir:
  - `entity`
  - `action`
  - `userId`
  - `userEmail`
  - `timestamp`
  - `data`
- Asegurar que el backend no falle si RabbitMQ no responde mediante `try-catch`, reconexión o publicaciones almacenadas temporalmente en un búfer.

## 5. Requisitos técnicos y de infraestructura

### Kubernetes con Ingress

- **Orquestación obligatoria:** todo el sistema debe ejecutarse sobre Kubernetes. Se recomienda Minikube o Kind para entornos locales, o un clúster en la nube.

- **Contenedores Docker:** cada servicio debe tener su propio `Dockerfile`:
  - Backend NestJS.
  - Microservicio de auditoría, en un lenguaje de libre elección como Go, Python, Node.js o Java.
  - Dashboard, servido mediante Nginx o un servidor Node.js.

- **Recursos de Kubernetes mediante manifiestos YAML:**
  - `Deployments` para cada servicio, con réplicas configurables.
  - `Services` de tipo `ClusterIP` para la comunicación interna entre pods.
  - `ConfigMaps` y `Secrets` para variables de entorno, credenciales de base de datos, RabbitMQ, JWT y otros datos de configuración.
  - `StatefulSets`, opcionales pero recomendados, para bases de datos o RabbitMQ cuando se requiera persistencia.
  - `PersistentVolumeClaims` (`PVC`) para los volúmenes de las bases de datos.

- **Ingress Controller y enrutamiento externo —requisito obligatorio—:**
  - Desplegar un Ingress Controller, por ejemplo **NGINX Ingress Controller**, en el clúster.
  - Crear un recurso `Ingress` que enrute el tráfico entrante hacia los diferentes servicios utilizando el dominio local `conjunta3p.espe.edu.ec`.
  - Para que el dominio funcione localmente, modificar el archivo `/etc/hosts` —o su equivalente en Windows— y apuntar `conjunta3p.espe.edu.ec` a la IP del clúster, como la IP de Minikube o del nodo.
  - Definir al menos las siguientes rutas:
    - `/api/audit` → microservicio de auditoría, API REST.
    - `/dashboard` → dashboard web con SSE.
    - `/api` → backend principal de CavaLocal. Esta ruta es opcional, pero se valora para centralizar el tráfico.
  - Se valorará el uso de TLS/HTTPS mediante certificados autofirmados o `cert-manager`, aunque no es obligatorio.

- **Comunicación interna:** los servicios deben resolverse mediante el DNS interno de Kubernetes. Ejemplo:

  ```text
  rabbitmq-service.default.svc.cluster.local
  ```

- **Health checks:** implementar `readinessProbe` y `livenessProbe` en todos los `Deployments`.

- **Escalabilidad:** el microservicio de auditoría debe poder escalar horizontalmente a dos o más réplicas sin duplicar el consumo de mensajes. RabbitMQ debe distribuir los mensajes mediante una cola competitiva.

## 6. Entregables

### 6.1. Repositorio Git

El repositorio debe incluir:

- Código fuente del microservicio de auditoría.
- Código fuente del dashboard.
- Parches o modificaciones del backend de CavaLocal.
- Carpeta `/k8s` con todos los manifiestos YAML:
  - `Deployments`
  - `Services`
  - `ConfigMaps`
  - `Secrets`
  - `PVC`
  - `Ingress`
  - Otros recursos necesarios
- Archivos `Dockerfile` para cada componente.
- Scripts de ayuda, por ejemplo:
  - `deploy.sh`
  - `destroy.sh`

### 6.2. Documentación técnica (`README.md`)

Debe contener:

- Diagrama de arquitectura que incluya los pods, servicios y el flujo de red en Kubernetes.
- Instrucciones paso a paso para levantar el clúster con Minikube o Kind, aplicar los manifiestos y verificar el funcionamiento.
- Variables de entorno requeridas y procedimiento para inyectarlas de forma segura mediante `Secrets`.
- Instrucciones para configurar `/etc/hosts` y acceder al dominio `conjunta3p.espe.edu.ec`.

## 7. Criterios de aceptación mínimos

- El backend publica eventos en RabbitMQ para las cinco entidades principales: vinos, tiendas, usuarios, reservas y pagos.
- El microservicio consume, persiste y expone los eventos correctamente.
- El dashboard se conecta al SSE y refleja las auditorías en un tiempo máximo de **2 segundos**.
- Todos los servicios están contenedorizados y se despliegan en Kubernetes mediante un solo comando:

  ```bash
  kubectl apply -f k8s/
  ```

- El recurso `Ingress` está correctamente definido. Después de configurar `/etc/hosts`, se puede acceder a:
  - `http://conjunta3p.espe.edu.ec/dashboard`
  - `http://conjunta3p.espe.edu.ec/api/audit`
- Los pods de auditoría escalan a dos réplicas y el consumo de mensajes se distribuye sin duplicados.
- Los health checks `liveness` y `readiness` están implementados y funcionan.
- La documentación permite a otro desarrollador levantar el entorno completo en un máximo de **15 minutos**.

## 8. Rúbrica de evaluación

La evaluación se realizará ejecutando el siguiente comando desde la carpeta `/k8s` del repositorio entregado:

```bash
kubectl apply -f .
```

> **Condición crítica:** si el comando falla y no se aplican correctamente todos los recursos, la calificación será de **0/20** automáticamente.

El proyecto debe ser replicable en cualquier computador con Kubernetes instalado —Minikube o Kind— siguiendo las instrucciones del `README.md`.

| Criterio | Puntuación |
|---|---:|
| RabbitMQ + microservicio de auditoría | 5 |
| Implementación SSE | 2,5 |
| Dashboard | 2,5 |
| Kubernetes | — |
| Base de datos | 2,5 |
| Backend | 2,5 |
| Frontend | 2,5 |
| Ingress —dominio local— | 2,5 |
| **Total** | **20** |

## 9. Evaluación práctica

El docente realizará la evaluación mediante los siguientes pasos:

1. Clonará el repositorio del estudiante.
2. Seguirá las instrucciones del `README.md` para construir las imágenes Docker o las descargará si están disponibles en un registro público.
3. Iniciará el clúster de Kubernetes mediante Minikube o Kind.
4. Ejecutará el despliegue:

   ```bash
   kubectl apply -f k8s/
   ```

5. Si el comando falla por errores sintácticos, recursos no encontrados, dependencias faltantes u otros problemas, la calificación será de **0/20**.
6. Si el despliegue es exitoso, verificará:
   - Que todos los pods estén en estado `Running` y con los health checks aprobados.
   - Que el `Ingress` esté activo y responda al dominio `conjunta3p.espe.edu.ec`, después de modificar `/etc/hosts`.
   - Que el dashboard muestre eventos en tiempo real al realizar operaciones en el backend.
   - Que la API de auditoría devuelva datos filtrados correctamente.
   - Que el microservicio pueda escalar a dos réplicas sin duplicar mensajes.
