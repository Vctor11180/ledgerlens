# Despliegue en Vercel — LedgerLens

## 1. Requisitos previos

- Cuenta en [Vercel](https://vercel.com)
- Repo en GitHub (p. ej. `Kenyi001/ledgerlens`)
- Variables de entorno (Glacier, IA) listas

## 2. Desplegar desde el dashboard

1. Entra en [vercel.com](https://vercel.com) y haz clic en **Add New → Project**.
2. Conecta el repo de GitHub si aún no lo está.
3. Importa **ledgerlens** (o el nombre de tu repo).
4. Configuración recomendada:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (raíz del repo)
   - **Build Command:** `cd ledgerlens-front && npm install && npm run build`
   - **Output Directory:** `ledgerlens-front/dist`
   - **Install Command:** `npm install`

5. Pulsa **Deploy** (la primera vez puede fallar si faltan variables de entorno).

## 3. Variables de entorno (obligatorias)

En **Project → Settings → Environment Variables**, añade:

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `GLACIER_API_KEY` | Key de Avalanche Glacier ([AvaCloud](https://app.avacloud.io/)) | ✅ Sí |
| `HUGGINGFACE_API_KEY` | Token de Hugging Face ([settings](https://huggingface.co/settings/tokens)) | Sí (o OpenAI/GenLayer) |
| `OPENAI_API_KEY` | Key de OpenAI (respaldo) | Recomendada como fallback |
| `AVAX_USD_PRICE` | Precio estimado AVAX (p. ej. 35) | Opcional |
| `ETH_USD_PRICE` | Precio estimado ETH (p. ej. 3500) | Opcional para Ethereum |

Aplica a **Production**, **Preview** y **Development** y guarda. Luego **Redeploy** el proyecto.

## 4. Desplegar desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la raíz del proyecto
cd c:\Users\daxke\Desktop\Proyectos\ledgerlens-backend
vercel

# Seguir las preguntas (link al proyecto, confirmar config)
# Para producción:
vercel --prod
```

Las variables se pueden definir en el dashboard o con `vercel env add VARIABLE_NAME`.

## 5. Verificación

Tras el deploy tendrás una URL como `https://ledgerlens-xxx.vercel.app`:

- **Frontend:** `https://tu-proyecto.vercel.app/`
- **Health:** `https://tu-proyecto.vercel.app/api/health`
- **Analyze:** `https://tu-proyecto.vercel.app/api/analyze/0x8dc08e5055e49b6F9d96aDC4AC277fDe44028367?chain=avalanche`

El frontend usa el mismo dominio para `/api/*`, así que no necesitas `VITE_API_URL` en producción.

## 6. Timeout (Hobby vs Pro)

- **Hobby (gratis):** 10 segundos por función.
- El análisis (Glacier + IA) puede superar 10 s.
- Si ves timeout 504:
  - **Pro:** aumenta `maxDuration` en `vercel.json` (ej. 60).
  - O optimiza el backend (menos txs, modelo más rápido).

## 7. Dominio personalizado

En **Project → Settings → Domains** puedes añadir tu propio dominio (p. ej. `ledgerlens.io`).
