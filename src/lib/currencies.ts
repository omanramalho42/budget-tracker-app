interface CurrenciesProps {
    value: "USD" | "EUR" | "BRL" | "GBP" | "JPY";
    label: "$ Dollar" | "€ Euro" | "R$ Real" | "£ Pound" | "¥ Yen";
    locale: "en-US" | "de-DE" | "pt-BR" | "en-GB" | "ja-JP";
}

export const Currencies: CurrenciesProps[] = [
    { value: "USD", label: "$ Dollar", locale: "en-US"},
    { value: "EUR", label: "€ Euro", locale: "de-DE"},
    { value: "BRL", label: "R$ Real", locale: "pt-BR"},
    { value: "GBP", label: "£ Pound", locale: "en-GB"},
    { value: "JPY", label: "¥ Yen", locale: "ja-JP"},
]

export type Currency = (typeof Currencies)[0]