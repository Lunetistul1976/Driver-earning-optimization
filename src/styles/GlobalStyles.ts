import styled, { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: ${theme.colors.bg};
    color: ${theme.colors.text};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  .leaflet-container {
    background: ${theme.colors.surface};
    border-radius: ${theme.radius.md};
  }
`;

export const AppShell = styled.div`
  display: flex;
  min-height: 100vh;
`;

export const Sidebar = styled.nav`
  width: 220px;
  background: ${theme.colors.surface};
  border-right: 1px solid ${theme.colors.border};
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
`;

export const Logo = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${theme.colors.accent};
  margin-bottom: 24px;
  padding: 0 12px;
`;

export const NavLink = styled.a<{ $active?: boolean }>`
  display: block;
  padding: 10px 12px;
  border-radius: ${theme.radius.sm};
  color: ${({ $active }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  background: ${({ $active }) => ($active ? theme.colors.surfaceHover : 'transparent')};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${theme.colors.surfaceHover};
    color: ${theme.colors.text};
  }
`;

export const Main = styled.main`
  flex: 1;
  padding: 32px;
  overflow-y: auto;
`;

export const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 24px;
`;

export const Grid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 4}, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  padding: 20px;
  box-shadow: ${theme.shadow};
`;

export const CardTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 500;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

export const CardValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
`;

export const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: ${theme.radius.sm};
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.15s, opacity 0.15s;

  ${({ $variant }) => {
    switch ($variant) {
      case 'danger':
        return `
          background: ${theme.colors.danger};
          color: white;
          &:hover { opacity: 0.9; }
        `;
      case 'secondary':
        return `
          background: ${theme.colors.surfaceHover};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
          &:hover { background: ${theme.colors.border}; }
        `;
      default:
        return `
          background: ${theme.colors.primary};
          color: white;
          &:hover { background: ${theme.colors.primaryHover}; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid ${theme.colors.border};
  }

  th {
    font-size: 0.8rem;
    font-weight: 600;
    color: ${theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  tr:hover td {
    background: ${theme.colors.surfaceHover};
  }
`;

export const Badge = styled.span<{ $color?: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $color }) => $color ?? theme.colors.primary}22;
  color: ${({ $color }) => $color ?? theme.colors.primary};
`;

export const Section = styled.section`
  margin-bottom: 32px;
`;

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
`;
