# 🐳 Taskflow Docker Setup Guide

Complete Docker configuration for the Taskflow full-stack project (React Frontend + Spring Boot Backend + MySQL Database).

## 📋 Prerequisites

- **Docker**: v20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: v2.0+ (included with Docker Desktop)
- **Git**: For cloning the repository

## 🚀 Quick Start

### 1. Clone and Navigate to Project

```bash
git clone https://github.com/packiyalakshmimurugan/Taskflow-fullstack-project.git
cd Taskflow-fullstack-project
```

### 2. Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit with your preferred values (optional, defaults are provided)
nano .env
```

### 3. Build and Run Docker Containers

```bash
# Build images and start all services
docker-compose up --build

# Or run in background (detached mode)
docker-compose up -d --build
```

**Expected Output:**
```
Creating taskflow-mysql ... done
Creating taskflow-backend ... done
Creating taskflow-frontend ... done
Creating taskflow-phpmyadmin ... done
```

### 4. Access Your Application

Once all services are healthy:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | React application |
| **Backend API** | http://localhost:8080 | Spring Boot API |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | API documentation |
| **phpMyAdmin** | http://localhost:8081 | Database management |

## 📦 Service Configuration

### Frontend Service
- **Port**: 5173
- **Built with**: React + Vite
- **Runtime**: Node.js 20 Alpine
- **Build stage**: Multi-stage build for optimization

### Backend Service
- **Port**: 8080
- **Framework**: Spring Boot 3.2.0
- **Runtime**: OpenJDK 21 JRE
- **Build stage**: Maven + Multi-stage build

### Database Service
- **Port**: 3306 (internal only)
- **Image**: MySQL 8.0 Alpine
- **Database**: taskflow
- **Default User**: taskflow / taskflowpass
- **Root Password**: rootpassword

### phpMyAdmin (Optional)
- **Port**: 8081
- **Purpose**: Web-based MySQL management

## 🔧 Common Commands

### View Container Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Stop Services

```bash
# Stop all running services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers and volumes (WARNING: data loss)
docker-compose down -v
```

### Rebuild Specific Service

```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Execute Commands in Container

```bash
# Run bash in backend container
docker-compose exec backend bash

# Run command in frontend container
docker-compose exec frontend npm list

# Access MySQL CLI
docker-compose exec mysql mysql -u taskflow -p taskflow
```

## 🌐 Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_ROOT_PASSWORD=rootpassword
DB_NAME=taskflow
DB_USER=taskflow
DB_PASSWORD=taskflowpass

# Backend
SPRING_PROFILE=prod
JWT_SECRET_KEY=your-secret-key-here
JWT_EXPIRATION_TIME=86400000

# Frontend
VITE_API_URL=http://localhost:8080
```

### Important Variables for Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_DATASOURCE_URL` | jdbc:mysql://mysql:3306/taskflow | MySQL connection |
| `SPRING_DATASOURCE_USERNAME` | taskflow | Database user |
| `SPRING_DATASOURCE_PASSWORD` | taskflowpass | Database password |
| `JWT_SECRET_KEY` | taskflow-secret-key-change-in-production | JWT signing key |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | update | Auto-create/update DB schema |

## 🔒 Security Considerations

### For Production:

1. **Change JWT Secret**
   ```env
   JWT_SECRET_KEY=generate-a-strong-random-key-here
   ```

2. **Use Strong Passwords**
   ```env
   DB_PASSWORD=GenerateRandomSecurePassword123!
   DB_ROOT_PASSWORD=AnotherSecurePassword456!
   ```

3. **Hide .env File**
   ```bash
   echo ".env" >> .gitignore
   ```

4. **Use Docker Secrets** (Swarm mode)
   - Store sensitive data in Docker secrets instead of .env

5. **Network Isolation**
   - Don't expose unnecessary ports
   - Use internal networking for MySQL

6. **Update Base Images**
   ```bash
   docker pull node:20-alpine
   docker pull eclipse-temurin:21-jre-alpine
   docker pull mysql:8.0-alpine
   ```

## 🧪 Health Checks

Services have built-in health checks:

```bash
# View health status
docker-compose ps

# NAME                    STATE
# taskflow-mysql          Up (healthy)
# taskflow-backend        Up (healthy)
# taskflow-frontend       Up (healthy)
```

## 📊 Data Persistence

MySQL data is persisted in a Docker volume:

```bash
# List volumes
docker volume ls | grep taskflow

# Backup database
docker-compose exec mysql mysqldump -u taskflow -p taskflow > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u taskflow -p taskflow < backup.sql
```

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Port 8080 in use: change port in docker-compose.yml
# - MySQL not ready: ensure mysql service is healthy
# - Out of memory: increase Docker memory allocation
```

### Frontend Build Errors

```bash
# Clear node_modules and reinstall
docker-compose down
docker volume prune
docker-compose up --build frontend
```

### Database Connection Issues

```bash
# Test MySQL connection
docker-compose exec mysql mysql -h localhost -u taskflow -p taskflow -e "SELECT 1;"

# Verify network connectivity
docker-compose exec backend ping mysql
```

### Port Already in Use

```bash
# Change ports in docker-compose.yml
# Or kill the process using the port:
# macOS/Linux: lsof -i :8080
# Windows: netstat -ano | findstr :8080
```

## 📈 Performance Optimization

### Build Optimization

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose up --build
```

### Memory Configuration

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1024M
        reservations:
          memory: 512M
```

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Docker Build & Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - name: Build and test
        run: docker-compose up --abort-on-container-exit
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Spring Boot in Docker](https://spring.io/guides/gs/spring-boot-docker/)
- [Vite Docker Guide](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server)
- [MySQL Docker Images](https://hub.docker.com/_/mysql)

## 🤝 Contributing

When updating Docker configuration:
1. Test locally with `docker-compose up`
2. Verify all services are healthy: `docker-compose ps`
3. Document changes in this file
4. Commit configuration files

## 📝 Next Steps

1. **Database Initialization**: Add SQL migration scripts to `init-db.sql`
2. **API Documentation**: Access Swagger UI at `http://localhost:8080/swagger-ui.html`
3. **Frontend Configuration**: Update `VITE_API_URL` if backend URL changes
4. **SSL/TLS Setup**: Add Nginx reverse proxy for HTTPS
5. **Logging**: Consider adding ELK stack for centralized logging

---

**Happy Dockerizing! 🎉**
