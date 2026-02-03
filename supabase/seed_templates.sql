-- Seed Invoice Templates

INSERT INTO public.invoice_templates (name, description, config, max_items, background_url, is_default, profile_id)
VALUES 
(
    'Minimal Clean',
    'Diseño limpio y moderno, ideal para freelances y agencias digitales.',
    '{
        "elements": [
            { "id": "t1", "type": "title", "x": 20, "y": 20, "content": "FACTURA", "fontSize": 40, "fontWeight": "900", "color": "#000000", "fontFamily": "Inter" },
            { "id": "in1", "type": "invoice_number", "x": 20, "y": 40, "fontSize": 10, "color": "#6B7280", "fontFamily": "Inter" },
            { "id": "d1", "type": "date", "x": 20, "y": 45, "fontSize": 10, "color": "#6B7280", "fontFamily": "Inter" },
            { "id": "iss1", "type": "issuer", "x": 20, "y": 65, "color": "#000000", "fontFamily": "Inter" },
            { "id": "rec1", "type": "recipient", "x": 120, "y": 65, "color": "#000000", "fontFamily": "Inter" },
            { "id": "tab1", "type": "table", "x": 20, "y": 110, "width": 170, "color": "#E5E7EB", "fontFamily": "Inter" },
            { "id": "tot1", "type": "total", "x": 120, "y": 230, "width": 70, "color": "#000000", "fontFamily": "Inter" }
        ],
        "global_font": "Inter"
    }',
    15,
    null,
    true,
    NULL
),
(
    'Corporate Blue',
    'Estilo formal y confiable, perfecto para empresas y consultorías.',
    '{
        "elements": [
            { "id": "t1", "type": "title", "x": 130, "y": 20, "content": "FACTURA", "fontSize": 32, "fontWeight": "700", "color": "#3B82F6", "align": "right", "fontFamily": "Roboto" },
            { "id": "in1", "type": "invoice_number", "x": 130, "y": 35, "fontSize": 10, "color": "#1E40AF", "align": "right", "fontFamily": "Roboto" },
            { "id": "iss1", "type": "issuer", "x": 20, "y": 20, "color": "#1F2937", "fontFamily": "Roboto" },
            { "id": "rec1", "type": "recipient", "x": 20, "y": 70, "color": "#374151", "fontFamily": "Roboto" },
            { "id": "tab1", "type": "table", "x": 20, "y": 120, "width": 170, "color": "#3B82F6", "fontFamily": "Roboto" },
            { "id": "tot1", "type": "total", "x": 120, "y": 240, "width": 70, "color": "#1E3A8A", "fontFamily": "Roboto" }
        ],
        "global_font": "Roboto"
    }',
    20,
    null,
    false,
    NULL
),
(
    'Creative Bold',
    'Alto impacto visual con tipografías fuertes y contrastes.',
    '{
        "elements": [
            { "id": "t1", "type": "title", "x": 20, "y": 20, "content": "INVOICE", "fontSize": 60, "fontWeight": "900", "color": "#000000", "fontFamily": "Oswald" },
            { "id": "line1", "type": "text", "x": 20, "y": 45, "content": "________________________________", "fontSize": 12, "color": "#a3e635", "fontFamily": "Inter" },
            { "id": "iss1", "type": "issuer", "x": 20, "y": 60, "color": "#000000", "fontFamily": "Oswald" },
            { "id": "rec1", "type": "recipient", "x": 120, "y": 60, "color": "#000000", "fontFamily": "Oswald" },
            { "id": "tab1", "type": "table", "x": 20, "y": 110, "width": 170, "color": "#000000", "fontFamily": "Inter" },
            { "id": "tot1", "type": "total", "x": 20, "y": 220, "width": 70, "color": "#000000", "fontFamily": "Oswald" }
        ],
        "global_font": "Oswald"
    }',
    12,
    null,
    false,
    NULL
);
