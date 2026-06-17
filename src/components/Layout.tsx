import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppShell,
  Sidebar,
  Logo,
  NavLink,
  Main,
} from '../styles/GlobalStyles';
import ShiftControls from './ShiftControls';
import { useActiveShift, usePositionTracking } from '../hooks/useShift';

const NavItem = styled(NavLink)``;

const ShiftBar = styled.div`
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme?.colors?.border ?? '#2d3a4f'};
`;

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/heatmap', label: 'Live Map' },
  { to: '/rides', label: 'Ride Log' },
  { to: '/analytics', label: 'Analytics' },
];

export default function Layout() {
  const location = useLocation();
  const { data: activeShift } = useActiveShift();
  usePositionTracking(!!activeShift);

  return (
    <AppShell>
      <Sidebar>
        <Logo>Ride Planner</Logo>
        {links.map((link) => (
          <NavItem
            key={link.to}
            as={RouterNavLink}
            to={link.to}
            $active={location.pathname === link.to}
          >
            {link.label}
          </NavItem>
        ))}
        <ShiftBar>
          <ShiftControls />
        </ShiftBar>
      </Sidebar>
      <Main>
        <Outlet />
      </Main>
    </AppShell>
  );
}
