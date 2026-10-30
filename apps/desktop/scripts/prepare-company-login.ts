/** Stage the versions server login endpoint without modifying installers or update feeds. */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'tsdown'

const output = resolve(process.argv[2] ?? 'apps/desktop/.desktop-build/company-login')
await mkdir(output, { recursive: true })
await build({ config: false, entry: ['apps/desktop/scripts/company-login-server.ts'], outDir: output,
  format: ['esm'], platform: 'node', target: 'node22', dts: false, clean: false,
  deps: { alwaysBundle: [/./] }, fixedExtension: true })
const nginx = await readFile('apps/desktop/config/intranet-nginx.conf', 'utf8')
if (!nginx.includes('    location / {')) throw new Error('Existing versions Nginx configuration has no default location')
await writeFile(resolve(output, 'intranet-nginx.conf'), nginx.replace('    location / {', `    location = /company-login/exchange {
        access_log off;
        client_max_body_size 4k;
        proxy_pass http://company-login:18766;
        proxy_read_timeout 35s;
        proxy_next_upstream off;
    }

    location / {`))
await writeFile(resolve(output, 'compose.yaml'), [
  'services:', '  versions:',
  '    image: ${VERSIONS_IMAGE:?Set the existing versions server image containing download files}',
  '    restart: unless-stopped', '    ports: ["18765:18765"]',
  '    depends_on: [company-login]',
  '    volumes: ["./intranet-nginx.conf:/etc/nginx/conf.d/default.conf:ro"]',
  '    pull_policy: never',
  '  company-login:', '    image: ${NODE_IMAGE:-node:22-slim}',
  '    pull_policy: never', '    user: node', '    working_dir: /app',
  '    volumes: ["./company-login-server.mjs:/app/company-login-server.mjs:ro"]',
  '    command: ["node", "company-login-server.mjs"]', '    restart: unless-stopped',
  '    env_file: ./company-login.env', '',
].join('\n'))
await writeFile(resolve(output, 'company-login.env.example'),
  'COMPANY_IAM_CLIENT_SECRET=\nCOMPANY_GATEWAY_AUTH_SECRET=\n')
const guide = await readFile('apps/desktop/packaging/README.zh.md', 'utf8')
await writeFile(resolve(output, 'README.md'), guide.slice(guide.indexOf('<a id="company-login"></a>')))
console.log(`Company login deployment staged: ${output}`)
