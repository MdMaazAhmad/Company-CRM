import {
    Document,
    Page,
    View,
    Text,
    StyleSheet,
  } from "@react-pdf/renderer";
  
  const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`);
  const three = (n: number) => {
    const h = Math.floor(n / 100), r = n % 100;
    return `${h ? ONES[h] + " Hundred" + (r ? " " : "") : ""}${r ? two(r) : ""}`;
  };
  function words(n: number): string {
    if (n === 0) return "Zero";
    const cr = Math.floor(n / 10000000), la = Math.floor((n % 10000000) / 100000), th = Math.floor((n % 100000) / 1000), re = n % 1000;
    let o = "";
    if (cr) o += `${two(cr)} Crore `;
    if (la) o += `${two(la)} Lakh `;
    if (th) o += `${two(th)} Thousand `;
    if (re) o += three(re);
    return o.trim();
  }
  function rupeesInWords(t: number): string {
    const r = Math.floor(t), p = Math.round((t - r) * 100);
    let w = `Indian Rupee ${words(r)}`;
    if (p) w += ` and ${words(p)} Paise`;
    return w + " Only";
  }
  const inr = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  export type InvoicePdfData = {
    org: {
      name: string;
      addressLines: string[];
      phone?: string;
      email?: string;
      website?: string;
      gstin?: string;
      placeOfSupply?: string;
    };
    client: { name: string; business?: string | null; addressLines: string[]; gstin?: string | null };
    invoice: { number: string; invoiceDate: string; dueDate: string; terms: string };
    item: { description: string; hsnSac?: string | null; qty: number; rate: number };
    tax: { gstRate: number; mode: "INTRA" | "INTER" };
    paidAmount: number;
  };
  
  const s = StyleSheet.create({
    page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
    frame: { borderWidth: 1, borderColor: "#000" },
    top: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
    orgName: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 5 },
    orgMeta: { fontSize: 8, color: "#333", lineHeight: 1.5 },
    taxTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#222" },
    metaGrid: { flexDirection: "row", borderTopWidth: 1, borderColor: "#000" },
    metaLeft: { width: "55%", borderRightWidth: 1, borderColor: "#000", padding: 10 },
    metaRight: { width: "45%", padding: 10 },
    metaRow: { flexDirection: "row", marginBottom: 2 },
    metaK: { width: 90, color: "#333" },
    metaV: { fontFamily: "Helvetica-Bold" },
    billTo: { borderTopWidth: 1, borderColor: "#000", padding: 11 },
    billName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 3 },
    billAddr: { fontSize: 8, color: "#333", lineHeight: 1.5 },
    thead: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#000" },
    th: { padding: 6, fontSize: 8, fontFamily: "Helvetica-Bold" },
    trow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
    td: { padding: 6, fontSize: 8 },
    cHash: { width: "5%", textAlign: "center" },
    cDescWide: { width: "46%" },
    cDescNarrow: { width: "37%" },
    cHsn: { width: "9%" },
    cQty: { width: "7%", textAlign: "right" },
    cRate: { width: "11%", textAlign: "right" },
    cTax: { width: "9%", textAlign: "right" },
    cTaxWide: { width: "13%", textAlign: "right" },
    cAmt: { width: "13%", textAlign: "right" },
    descTitle: { fontFamily: "Helvetica-Bold", marginBottom: 3 },
    descBody: { color: "#444", lineHeight: 1.5 },
    totals: { flexDirection: "row", justifyContent: "flex-end" },
    totalsBox: { width: 240 },
    tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 16 },
    tGrand: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#000", paddingVertical: 6, paddingHorizontal: 16 },
    tGrandTxt: { fontFamily: "Helvetica-Bold", fontSize: 12 },
    tBalanceTxt: { fontFamily: "Helvetica-Bold" },
    words: { padding: 11 },
    wordsLbl: { color: "#333", marginBottom: 2, fontSize: 8 },
    wordsVal: { fontFamily: "Helvetica-BoldOblique", fontSize: 9 },
    thanks: { paddingHorizontal: 11, paddingBottom: 14, fontSize: 8 },
  });
  
  export function InvoicePdf({ data }: { data: InvoicePdfData }) {
    const subTotal = data.item.qty * data.item.rate;
    const inter = data.tax.mode === "INTER";
    const igst = inter ? (subTotal * data.tax.gstRate) / 100 : 0;
    const half = data.tax.gstRate / 2;
    const cgst = inter ? 0 : (subTotal * half) / 100;
    const sgst = cgst;
    const totalTax = inter ? igst : cgst + sgst;
    const total = subTotal + totalTax;
    const balance = total - data.paidAmount;
    const [descTitle, ...descRest] = data.item.description.split("\n");
  
    const descCol = inter ? s.cDescWide : s.cDescNarrow;
    const taxCol = inter ? s.cTaxWide : s.cTax;
  
    return (
      <Document>
        <Page size="A4" style={s.page}>
          <View style={s.frame}>
            <View style={s.top}>
              <View>
                <Text style={s.orgName}>{data.org.name}</Text>
                <View style={s.orgMeta}>
                  {data.org.addressLines.map((l, i) => <Text key={i}>{l}</Text>)}
                  {data.org.phone ? <Text>{data.org.phone}</Text> : null}
                  {data.org.email ? <Text>{data.org.email}</Text> : null}
                  {data.org.website ? <Text>{data.org.website}</Text> : null}
                  {data.org.gstin ? <Text>GSTIN: {data.org.gstin}</Text> : null}
                </View>
              </View>
              <Text style={s.taxTitle}>TAX INVOICE</Text>
            </View>
  
            <View style={s.metaGrid}>
              <View style={s.metaLeft}>
                <View style={s.metaRow}><Text style={s.metaK}>Invoice Number</Text><Text style={s.metaV}>: {data.invoice.number}</Text></View>
                <View style={s.metaRow}><Text style={s.metaK}>Invoice Date</Text><Text style={s.metaV}>: {data.invoice.invoiceDate}</Text></View>
                <View style={s.metaRow}><Text style={s.metaK}>Terms</Text><Text style={s.metaV}>: {data.invoice.terms}</Text></View>
                <View style={s.metaRow}><Text style={s.metaK}>Due Date</Text><Text style={s.metaV}>: {data.invoice.dueDate}</Text></View>
              </View>
              <View style={s.metaRight}>
                <View style={s.metaRow}><Text style={s.metaK}>Place Of Supply</Text><Text style={s.metaV}>: {data.org.placeOfSupply ?? "-"}</Text></View>
              </View>
            </View>
  
            <View style={s.billTo}>
              <Text style={s.billName}>{data.client.business || data.client.name}</Text>
              <View style={s.billAddr}>
                {data.client.addressLines.map((l, i) => <Text key={i}>{l}</Text>)}
                {data.client.gstin ? <Text>GSTIN {data.client.gstin}</Text> : null}
              </View>
            </View>
  
            <View style={s.thead}>
              <Text style={[s.th, s.cHash]}>#</Text>
              <Text style={[s.th, descCol]}>Description</Text>
              <Text style={[s.th, s.cHsn]}>HSN/SAC</Text>
              <Text style={[s.th, s.cQty]}>Qty</Text>
              <Text style={[s.th, s.cRate]}>Rate</Text>
              {inter ? (
                <Text style={[s.th, taxCol]}>IGST</Text>
              ) : (
                <>
                  <Text style={[s.th, taxCol]}>CGST</Text>
                  <Text style={[s.th, taxCol]}>SGST</Text>
                </>
              )}
              <Text style={[s.th, s.cAmt]}>Amount</Text>
            </View>
  
            <View style={s.trow}>
              <Text style={[s.td, s.cHash]}>1</Text>
              <View style={[s.td, descCol]}>
                <Text style={s.descTitle}>{descTitle}</Text>
                {descRest.length > 0 && <Text style={s.descBody}>{descRest.join("\n")}</Text>}
              </View>
              <Text style={[s.td, s.cHsn]}>{data.item.hsnSac ?? ""}</Text>
              <Text style={[s.td, s.cQty]}>{data.item.qty.toFixed(2)}</Text>
              <Text style={[s.td, s.cRate]}>{inr(data.item.rate)}</Text>
              {inter ? (
                <Text style={[s.td, taxCol]}>{data.tax.gstRate}%{"\n"}{inr(igst)}</Text>
              ) : (
                <>
                  <Text style={[s.td, taxCol]}>{half}%{"\n"}{inr(cgst)}</Text>
                  <Text style={[s.td, taxCol]}>{half}%{"\n"}{inr(sgst)}</Text>
                </>
              )}
              <Text style={[s.td, s.cAmt]}>{inr(subTotal)}</Text>
            </View>
  
            <View style={s.totals}>
              <View style={s.totalsBox}>
                <View style={s.tRow}><Text>Sub Total</Text><Text>{inr(subTotal)}</Text></View>
                {inter ? (
                  <View style={s.tRow}><Text>IGST ({data.tax.gstRate}%)</Text><Text>{inr(igst)}</Text></View>
                ) : (
                  <>
                    <View style={s.tRow}><Text>CGST ({half}%)</Text><Text>{inr(cgst)}</Text></View>
                    <View style={s.tRow}><Text>SGST ({half}%)</Text><Text>{inr(sgst)}</Text></View>
                  </>
                )}
                <View style={[s.tRow, s.tGrand]}><Text style={s.tGrandTxt}>Total</Text><Text style={s.tGrandTxt}>{"\u20B9"}{inr(total)}</Text></View>
                {data.paidAmount > 0 && <View style={s.tRow}><Text>Payment Made</Text><Text>(-) {inr(data.paidAmount)}</Text></View>}
                <View style={s.tRow}><Text style={s.tBalanceTxt}>Balance Due</Text><Text style={s.tBalanceTxt}>{"\u20B9"}{inr(balance)}</Text></View>
              </View>
            </View>
  
            <View style={s.words}>
              <Text style={s.wordsLbl}>Total In Words</Text>
              <Text style={s.wordsVal}>{rupeesInWords(total)}</Text>
            </View>
            <Text style={s.thanks}>Thanks for your business.</Text>
          </View>
        </Page>
      </Document>
    );
  }