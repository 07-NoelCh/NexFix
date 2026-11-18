import type { Container } from '../../src/container';
import { openApiDocument } from '../../src/http/openapi';
import { buildRouter } from '../../src/http/routes';

interface RouterLayer {
  route?: { path: string; methods: Record<string, boolean> };
}

describe('documentación OpenAPI', () => {
  it('documenta todas las rutas del router y ninguna inventada', () => {
    const stack = (buildRouter({} as Container) as unknown as { stack: RouterLayer[] }).stack;

    const reales = stack
      .flatMap((layer) => (layer.route ? [layer.route] : []))
      .flatMap((route) =>
        Object.keys(route.methods)
          .filter((method) => route.methods[method])
          .map((method) => `${method.toUpperCase()} ${route.path.replace(/:(\w+)/g, '{$1}')}`)
      )
      .sort();

    const documentadas = Object.entries(openApiDocument.paths)
      .flatMap(([path, operations]) => Object.keys(operations).map((method) => `${method.toUpperCase()} ${path}`))
      .sort();

    expect(documentadas).toEqual(reales);
  });

  it('todo endpoint protegido declara seguridad y los públicos no', () => {
    const publicos = ['/health', '/auth/login', '/tracking'];
    for (const [path, operations] of Object.entries(openApiDocument.paths)) {
      for (const operation of Object.values(operations) as { security?: unknown }[]) {
        if (publicos.includes(path)) expect(operation.security).toBeUndefined();
        else expect(operation.security).toEqual([{ bearerAuth: [] }]);
      }
    }
  });
});