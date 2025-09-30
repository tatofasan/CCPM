import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface LowStockAlertEmailProps {
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  supplierName: string;
  appUrl: string;
}

export default function LowStockAlertEmail({
  productName,
  sku,
  currentStock,
  threshold,
  supplierName,
  appUrl,
}: LowStockAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Low stock alert: {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Low Stock Alert</Text>

          <Section style={section}>
            <Text style={alertText}>
              ⚠️ Product stock is running low and requires immediate attention.
            </Text>

            <Section style={detailsBox}>
              <Text style={label}>Product:</Text>
              <Text style={productNameStyle}>{productName}</Text>

              <Text style={label}>SKU:</Text>
              <Text style={value}>{sku}</Text>

              <Text style={label}>Current Stock:</Text>
              <Text style={stockValueStyle}>
                {currentStock} units
                {currentStock === 0 && <span style={outOfStockStyle}> (OUT OF STOCK)</span>}
              </Text>

              <Text style={label}>Low Stock Threshold:</Text>
              <Text style={value}>{threshold} units</Text>

              <Text style={label}>Supplier:</Text>
              <Text style={value}>{supplierName}</Text>
            </Section>

            <Text style={text}>
              {currentStock === 0
                ? 'This product is completely out of stock. New orders cannot be fulfilled until stock is replenished.'
                : `Stock is below the threshold of ${threshold} units. Consider restocking soon to avoid order fulfillment delays.`}
            </Text>

            <Button href={`${appUrl}/products/${sku}`} style={button}>
              View Product Details
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              This is an automated alert. Please contact the supplier to arrange restocking.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1f2937',
  padding: '0 48px',
};

const section = {
  padding: '0 48px',
};

const alertText = {
  fontSize: '18px',
  lineHeight: '28px',
  color: '#dc2626',
  fontWeight: '600',
  backgroundColor: '#fef2f2',
  padding: '16px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '2px solid #dc2626',
};

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
};

const detailsBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #f59e0b',
};

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '8px 0 4px 0',
};

const value = {
  fontSize: '16px',
  color: '#1f2937',
  margin: '0 0 12px 0',
};

const productNameStyle = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#1f2937',
  margin: '0 0 12px 0',
} as React.CSSProperties;

const stockValueStyle = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#f59e0b',
  margin: '0 0 12px 0',
} as React.CSSProperties;

const outOfStockStyle = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: 700,
} as React.CSSProperties;

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '24px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '12px',
};