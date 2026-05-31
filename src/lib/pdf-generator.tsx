import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Register Inter font for premium look
// Custom Font registration removed to prevent "Offset is outside the bounds of the DataView" error
// which occurs when the font fails to load or parse correctly in the browser environment.
// Using standard PDF fonts (Helvetica) ensures reliability.

// PDF styles
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 11,
        paddingTop: 60,
        paddingBottom: 60,
        paddingLeft: 55,
        paddingRight: 55,
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        paddingBottom: 20,
    },
    logo: {
        fontSize: 8,
        fontWeight: 700,
        color: '#9ca3af',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 700,
        color: '#111827',
        textAlign: 'center',
        marginBottom: 30,
    },
    body: {
        lineHeight: 1.8,
        color: '#374151',
        textAlign: 'justify',
    },
    paragraph: {
        marginBottom: 12,
    },
    dateCity: {
        marginTop: 40,
        textAlign: 'right',
        color: '#6b7280',
        fontSize: 10,
    },
    signature: {
        marginTop: 60,
        textAlign: 'center',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000000',
        width: 200,
        marginHorizontal: 'auto',
        marginBottom: 8,
    },
    signatureName: {
        fontWeight: 700,
        color: '#111827',
        fontSize: 12,
    },
    signatureRegistry: {
        color: '#6b7280',
        fontSize: 9,
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 55,
        right: 55,
        fontSize: 8,
        color: '#9ca3af',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 10,
    },
});

export interface DocumentPDFData {
    type: string;
    title: string;
    content: string;
    patientName: string;
    patientDoc?: string;
    professionalName: string;
    professionalRegistry: string;
    date: string;
    clinicName?: string;
}

// Strip HTML tags for PDF text
const stripHtml = (html: string): string => {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
};

// Document component using JSX
const DocumentPDF: React.FC<{ data: DocumentPDFData }> = ({ data }) => {
    const paragraphs = stripHtml(data.content)
        .split('\n\n')
        .filter(p => p.trim());

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>{data.clinicName || 'NEURONEX'}</Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>{data.title}</Text>

                {/* Body */}
                <View style={styles.body}>
                    {paragraphs.map((p, i) => (
                        <Text key={i} style={styles.paragraph}>{p}</Text>
                    ))}
                </View>

                {/* Date and City */}
                <Text style={styles.dateCity}>{data.date}</Text>

                {/* Signature */}
                <View style={styles.signature}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureName}>{data.professionalName}</Text>
                    <Text style={styles.signatureRegistry}>{data.professionalRegistry}</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text>Documento gerado digitalmente via NeuroNex • Verificação de autenticidade disponível</Text>
                </View>
            </Page>
        </Document>
    );
};

// Generate PDF blob
export const generateDocumentPDF = async (data: DocumentPDFData): Promise<Blob> => {
    const blob = await pdf(<DocumentPDF data={data} />).toBlob();
    return blob;
};

// Generate PDF as base64 string for email attachment
export const generateDocumentPDFBase64 = async (data: DocumentPDFData): Promise<string> => {
    const blob = await generateDocumentPDF(data);
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
};

// Download PDF directly in browser
export const downloadDocumentPDF = async (data: DocumentPDFData, filename?: string): Promise<void> => {
    const blob = await generateDocumentPDF(data);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${data.type.toLowerCase()}_${data.patientName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};


// --- RECEIPT GENERATOR ---

export interface ReceiptPDFData {
    professionalName: string;
    professionalRegistry: string;
    patientName: string;
    patientDoc?: string;
    amountFormatted: string;
    description: string;
    date: string;
    location?: string;
}

const ReceiptPDF: React.FC<{ data: ReceiptPDFData }> = ({ data }) => {
    return (
        <Document>
            <Page size="A4" style={{
                fontFamily: 'Helvetica',
                padding: 40,
                backgroundColor: '#ffffff'
            }}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 60,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eeeeee',
                    paddingBottom: 25
                }}>
                    <View>
                        <View style={{
                            width: 30,
                            height: 30,
                            backgroundColor: '#000000',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 10,
                            borderRadius: 4
                        }}>
                            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>N</Text>
                        </View>
                        <Text style={{ fontSize: 8, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase' }}>
                            NeuroNex Payments
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>RECIBO</Text>
                        <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, fontFamily: 'Helvetica' }}>
                            #{Math.random().toString(36).substr(2, 8).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Amount */}
                <View style={{ marginBottom: 40, borderLeftWidth: 2, borderLeftColor: '#000000', paddingLeft: 15 }}>
                    <Text style={{ fontSize: 7, color: '#9ca3af', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, fontWeight: 'bold' }}>
                        VALOR NOMINAL
                    </Text>
                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#111827' }}>
                        {data.amountFormatted}
                    </Text>
                </View>

                {/* Content */}
                <View style={{ marginBottom: 40 }}>
                    <Text style={{ fontSize: 12, lineHeight: 1.8, color: '#374151', textAlign: 'justify' }}>
                        Recebemos de <Text style={{ fontWeight: 'bold', color: '#000000' }}>{data.patientName}</Text>
                        {data.patientDoc ? <Text style={{ color: '#6b7280' }}> (CPF: {data.patientDoc})</Text> : null},
                        a importncia supra citada, referente aos serviços profissionais descritos abaixo:
                    </Text>

                    <View style={{
                        marginTop: 25,
                        padding: 20,
                        backgroundColor: '#fafafa',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#f0f0f0'
                    }}>
                        <Text style={{ fontSize: 11, color: '#374151', fontStyle: 'italic' }}>
                            {data.description}
                        </Text>
                    </View>
                </View>

                {/* Footer Info */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                    <View>
                        <Text style={{ fontSize: 8, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' }}>
                            Local & Data
                        </Text>
                        {data.location ? <Text style={{ fontSize: 10, color: '#111827', marginBottom: 2 }}>{data.location}</Text> : null}
                        <Text style={{ fontSize: 10, color: '#6b7280' }}>{data.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 8, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' }}>
                            Profissional
                        </Text>
                        <Text style={{ fontSize: 10, color: '#111827', fontWeight: 'bold', marginBottom: 2 }}>{data.professionalName}</Text>
                        <Text style={{ fontSize: 9, color: '#6b7280' }}>{data.professionalRegistry}</Text>
                    </View>
                </View>

                {/* Signature */}
                <View style={{ marginTop: 80, alignItems: 'center' }}>
                    <View style={{
                        borderTopWidth: 1,
                        borderTopColor: '#000000',
                        width: 200,
                        paddingTop: 10,
                        alignItems: 'center'
                    }}>
                        <Text style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4, fontStyle: 'italic' }}>Assinado Digitalmente</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#111827' }}>
                            {data.professionalName}
                        </Text>
                    </View>
                </View>

                {/* Bottom Bar */}
                <View style={{
                    position: 'absolute',
                    bottom: 40,
                    left: 40,
                    right: 40,
                    borderTopWidth: 1,
                    borderTopColor: '#f3f4f6',
                    paddingTop: 15,
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                }}>
                    <Text style={{ fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Documento Autenticado
                    </Text>
                    <Text style={{ fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                        NeuroNex · Serviços financeiros por Asaas
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export const generateReceiptPDF = async (data: ReceiptPDFData): Promise<Blob> => {
    return await pdf(<ReceiptPDF data={data} />).toBlob();
};

export const generateReceiptPDFBase64 = async (data: ReceiptPDFData): Promise<string> => {
    const blob = await generateReceiptPDF(data);
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};
