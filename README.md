# 🎟️ TicketCasino

> **Sistema Integral de Gestión y Digitalización de Tiquetes de Alimentación**  
> Desarrollado por **Santiago Castillo Rudas** (*@santiagodevx*)  
> *Torneo de Programación UNICARIBE*

---

## 📌 Descripción del Proyecto

**TicketCasino** es una solución web fullstack diseñada para modernizar y digitalizar el control de alimentación en entornos corporativos. Reemplaza las tirillas físicas de papel, mitigando fraudes, duplicidades y la falta de trazabilidad.

El sistema gestiona ciclos de tickets para almuerzos y meriendas, garantizando una regla de negocio estricta (máximo 1 almuerzo y 1 merienda por día por empleado), validación ágil mediante lectura de códigos QR con la cámara, y analíticas de consumo.

---

## ✨ Características

- **Gestión de Empleados:** Creación, edición, activación/inactivación y credenciales de acceso.
- **Generación de Tickets:** Masiva para todos los empleados activos o individual por tipo (`ALMUERZO` / `MERIENDA`), con control de periodo (15 tickets cada 15 días).
- **Regla diaria:** El backend rechaza el uso de un segundo ticket del mismo tipo en el mismo día.
- **Validación por QR:** Lector de cámara en tiempo real con autoreinicio de 3 segundos tras un escaneo exitoso, más fallback de ingreso manual por ID.
- **Portal del Empleado (Mobile-First):** El trabajador consulta su saldo, presenta su QR en el comedor y revisa su historial desde el celular.
- **Analíticas:** Estadísticas de consumos diarios, tickets por estado y ranking de top consumidores.
- **Seguridad:** Autenticación JWT con roles (`ADMIN` / `EMPLOYEE`), contraseñas hasheadas con bcrypt.
- **Tareas automáticas (Cron):** Generación de tickets los días 1 y 16 de cada mes, y expiración de tickets vencidos a medianoche.

---

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Uso |
|---|---|
| [NestJS](https://nestjs.com/) | Framework principal (Node.js + TypeScript) |
| [@nestjs/swagger](https://swagger.io/) | Documentación interactiva OpenAPI |
| [Prisma ORM](https://www.prisma.io/) | Acceso a base de datos |
| MySQL 8.0 | Base de datos |
| Passport.js + JWT | Autenticación y autorización |
| bcryptjs | Hash de contraseñas |
| dayjs | Cálculos de fechas |
| @nestjs/schedule | Tareas cron |

### Frontend
| Tecnología | Uso |
|---|---|
| React 19 + [Vite](https://vitejs.dev/) | Framework y bundler |
| [Tailwind CSS v4](https://tailwindcss.com/) | Estilos |
| Radix UI (shadcn/ui) | Componentes accesibles (Dialog, Tabs, etc.) |
| [Lucide React](https://lucide.dev/) | Iconos |
| [Sonner](https://sonner.emilkowal.ski/) | Notificaciones toast |
| Axios | Cliente HTTP con interceptores JWT |
| `@zxing/browser` | Lectura de QR por cámara |
| `qrcode` | Generación de códigos QR |

### Infraestructura
| Tecnología | Uso |
|---|---|
| Docker + Docker Compose | Orquestación de servicios |
| Nginx Alpine | Servidor del SPA y reverse proxy hacia la API |

---

## 🚀 Despliegue con Docker (Recomendado)

### Requisitos
- [Docker](https://www.docker.com/) con Docker Compose instalado.

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/santiagodevx/ticketcasino-unicaribe.git
cd TicketCasino

# 2. Crear el archivo de variables de entorno
cp .env.example .env

# 3. Levantar todos los servicios
docker compose up -d --build
```

Accede en tu navegador a **http://localhost**

> **Credenciales de administrador por defecto:**
> - Usuario: `admin`
> - Contraseña: `admin123`

---

## 📚 Documentación Interactiva de la API (Swagger)

Con la aplicación en marcha, puedes acceder a la especificación interactiva OpenAPI / Swagger directamente en:

🔗 **`http://localhost/api/api-docs`** *(vía Docker/Nginx)*  
🔗 **`http://localhost:3000/api/api-docs`** *(en desarrollo local)*

Desde la interfaz Swagger es posible inspeccionar todos los esquemas DTOs, probar los endpoints y autenticarse con el botón **Authorize** usando el token Bearer JWT.

---

## 💻 Desarrollo Local (Sin Docker)

### Requisitos
- Node.js 20+
- MySQL 8 corriendo localmente

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Ajusta DATABASE_URL en .env

npx prisma migrate dev
npm run start:dev        # Puerto 3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # Puerto 5173 (proxy → localhost:3000)
```

---

## 📂 Estructura del Proyecto

```
TicketCasino/
├── backend/
│   ├── prisma/             # Esquema y migraciones
│   └── src/
│       ├── auth/           # JWT, Guards, login admin y empleado
│       ├── employees/      # CRUD de empleados
│       ├── tickets/        # Generación, validación y expiración de tickets
│       ├── analytics/      # Métricas de consumo
│       └── main.ts
├── frontend/
│   └── src/
│       ├── components/     # UI base, Sidebar, QRScanner, QRCodeView
│       ├── pages/          # Dashboard, Empleados, Portal, Validación, Login
│       └── api.js          # Cliente Axios con interceptores
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📄 Licencia

Proyecto desarrollado con fines académicos para el **Torneo de Programación UNICARIBE**.
