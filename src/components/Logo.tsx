import { useState } from 'react'

interface Props {
  /**
   * Ruta pública de tu logo. Por defecto `/logo.webp`, que corresponde a
   * `public/logo.webp`. Si prefieres otro archivo, ponlo en `public/` y cambia
   * esta ruta (o pásala desde `App.tsx`).
   */
  src?: string
  /** Tamaño del cuadro en píxeles. */
  size?: number
  /** Inicial que se muestra si no hay imagen disponible. */
  label?: string
  className?: string
}

/**
 * Hueco cuadrado para el logo de la marca.
 *
 * Cuando la imagen carga se muestra tal cual (fondo transparente sobre el tema
 * oscuro, sin recortes). Si el archivo falta o no se puede leer, cae a un
 * marcador con la inicial sobre el degradado de la marca, para que el diseño
 * nunca se vea roto.
 */
export default function Logo({ src = '/logo.webp', size = 58, label = 'C', className = '' }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`brand-glow grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-sand-500 ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          aria-hidden="true"
          className="font-black text-white drop-shadow"
          style={{ fontSize: size * 0.45 }}
        >
          {label}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] ring-1 ring-brand-500/20 ring-inset ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt="Logo"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="size-full object-contain p-1"
      />
    </div>
  )
}
