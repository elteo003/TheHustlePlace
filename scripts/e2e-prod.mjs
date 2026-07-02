import { spawn } from 'node:child_process'

process.env.E2E_PROD = '1'

const child = spawn('npx', ['playwright', 'test'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
})

child.on('exit', (code) => process.exit(code ?? 1))
