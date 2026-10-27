'use client';

import {
  createContext,
  useCallback,
  useContext,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';

type RouteParams = Record<string, string>;

const RouteParamsContext = createContext<RouteParams>({});
const RouteOutletContext = createContext<ReactNode>(null);

export function RouteParamsProvider({ value, children }: { value: RouteParams; children: ReactNode }) {
  return <RouteParamsContext.Provider value={value}>{children}</RouteParamsContext.Provider>;
}

export function RouteOutletProvider({ value, children }: { value: ReactNode; children: ReactNode }) {
  return <RouteOutletContext.Provider value={value}>{children}</RouteOutletContext.Provider>;
}

export function Outlet() {
  return useContext(RouteOutletContext);
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
};

export function Link({ to, ...props }: LinkProps) {
  return <NextLink href={to} {...props} />;
}

type NavLinkProps = Omit<LinkProps, 'className'> & {
  end?: boolean;
  className?: string | ((state: { isActive: boolean; isPending: boolean }) => string);
};

export function NavLink({ to, end, className, ...props }: NavLinkProps) {
  const pathname = usePathname() ?? '';
  const active = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const resolvedClassName = typeof className === 'function'
    ? className({ isActive: active, isPending: false })
    : className;

  return <NextLink href={to} aria-current={active ? 'page' : undefined} className={resolvedClassName} {...props} />;
}

export function useNavigate() {
  const router = useRouter();
  return useCallback((to: string | number) => {
    if (typeof to === 'number') {
      router.back();
    } else {
      router.push(to);
    }
  }, [router]);
}

export function useParams<T extends RouteParams = RouteParams>() {
  return useContext(RouteParamsContext) as T;
}

export function useLocation() {
  const pathname = usePathname() ?? '';
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString() ?? '';
  return { pathname, search: search ? `?${search}` : '', hash: '' };
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | string | ((current: URLSearchParams) => URLSearchParams)) => void,
] {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const currentParams = useNextSearchParams();
  const search = currentParams?.toString() ?? '';

  const setSearchParams = useCallback((
    next: URLSearchParams | string | ((current: URLSearchParams) => URLSearchParams),
  ) => {
    const current = new URLSearchParams(search);
    const updated = typeof next === 'function' ? next(current) : new URLSearchParams(next);
    const query = updated.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, search]);

  return [new URLSearchParams(search), setSearchParams];
}
