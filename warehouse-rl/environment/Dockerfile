FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

FROM node:24-alpine AS development

WORKDIR /app
ENV NODE_ENV=development

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
