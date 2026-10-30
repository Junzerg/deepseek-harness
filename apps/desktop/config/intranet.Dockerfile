# Override with an existing server-local Nginx image tag for offline builds.
ARG NGINX_IMAGE=nginx:stable-alpine
FROM ${NGINX_IMAGE}

COPY intranet-nginx.conf /etc/nginx/conf.d/default.conf
COPY versions/ /srv/lingxi-office/versions/
COPY updates/ /srv/lingxi-office/updates/

EXPOSE 18765
