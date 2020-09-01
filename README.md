For production run the following commands in docker-compose-prod/hgf:
- ``docker-compose up --build -d``

For development run the following commands in docker-compose-dev/hgf-dev:
- ``docker-compose up --build -d && docker exec -it hgf-dev-express sh -c "npm run start:docker:dev"``
