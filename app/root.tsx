import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from 'remix'
import type { MetaFunction } from 'remix'
import styles from './tailwind.css'
import customStyles from './styles.css'
import { Fragment } from 'react'

export function links() {
  return [
    { rel: 'stylesheet', href: styles },
    { rel: 'stylesheet', href: customStyles }
  ]
}

export const meta: MetaFunction = () => {
  return { title: '💣 Buscaminas!' }
}

export default function App() {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1' />
        <Meta />
        <Links />

        {process.env.NODE_ENV !== 'development' && (
          <Fragment>
            <script async src='https://www.googletagmanager.com/gtag/js?id=G-KGET8L83FQ'></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KGET8L83FQ');`
              }}
            ></script>
          </Fragment>
        )}
      </head>
      <body className='h-[calc(100vh+1px)]'>
        <main className='min-h-[90vh]'>
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
        <footer className='min-h-[10vh] bg-gray-900 text-white p-4'>
          <a className='hover:underline' href='https://github.com/hiei189/buscaminas'>
            Repositorio
          </a>
        </footer>
      </body>
    </html>
  )
}
