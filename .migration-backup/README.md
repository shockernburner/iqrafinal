# iqrafinal

## Local launcher

Run everything from repo root without cwd issues:

- `./start-iqra.sh` - stable mode on `http://localhost:3001`
- `./start-iqra.sh --tunnel` - stable mode + cloudflared tunnel
- `./start-iqra.sh --dev` - dev mode on `http://localhost:3001`
- `./start-iqra.sh --stop` - stop local Next.js/cloudflared processes