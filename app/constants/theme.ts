export const COLORS = {
    background:     '#F5F3EF',   // topla kremasta — Flighty-style ozadje
    card:           '#FFFFFF',
    primary:        '#C96B4E',   // retro terrakota/coral
    primaryLight:   '#F5E6E1',   // svetla coral za tinte
    secondary:      '#7BA99A',   // umirjena šalvija
    textPrimary:    '#1C1C1E',   // Apple primary text
    textSecondary:  '#636366',   // Apple secondary
    textTertiary:   '#AEAEB2',   // Apple tertiary
    border:         '#E5E5EA',   // Apple separator
    success:        '#34C759',   // Apple green
    error:          '#FF3B30',   // Apple red
};

export const FONTS = {
    largeTitle:  { fontSize: 34, fontWeight: '700' as const, color: COLORS.textPrimary },
    title1:      { fontSize: 28, fontWeight: '700' as const, color: COLORS.textPrimary },
    title2:      { fontSize: 22, fontWeight: '600' as const, color: COLORS.textPrimary },
    title3:      { fontSize: 18, fontWeight: '600' as const, color: COLORS.textPrimary },
    body:        { fontSize: 16, fontWeight: '400' as const, color: COLORS.textPrimary },
    callout:     { fontSize: 15, fontWeight: '400' as const, color: COLORS.textSecondary },
    caption:     { fontSize: 13, fontWeight: '400' as const, color: COLORS.textTertiary },
};

export const CARD = {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
};
