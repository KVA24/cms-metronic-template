# build environment
FROM node:20-alpine AS build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm install --force
COPY src /app/src
COPY public /app/public
COPY index.html /app
COPY vite.config.ts /app
COPY tsconfig.json /app
COPY tsconfig.app.json /app
COPY tsconfig.node.json /app
RUN npm run build

# production environment
FROM nginx:1.23.1-alpine
WORKDIR /
COPY --from=build /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx
COPY nginx/vhost-nginx.conf /etc/nginx/conf.d
COPY docker-entrypoint.sh generate_config_js.sh /
COPY robots/robots.txt /usr/share/nginx/html/robots.txt

RUN chmod +x docker-entrypoint.sh generate_config_js.sh

EXPOSE 9005

ENTRYPOINT ["/docker-entrypoint.sh"]
