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

interface DepositApprovedEmailProps {
  userName: string;
  amount: string;
  newBalance: string;
  referenceNumber: string;
  appUrl: string;
}

export default function DepositApprovedEmail({
  userName,
  amount,
  newBalance,
  referenceNumber,
  appUrl,
}: DepositApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your deposit has been credited to your account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Deposit Credited!</Text>

          <Section style={section}>
            <Text style={text}>
              Great news, {userName}! Your deposit has been approved and credited to your wallet.
            </Text>

            <Section style={detailsBox}>
              <Text style={label}>Deposit Amount:</Text>
              <Text style={amountStyle}>${amount}</Text>

              <Text style={label}>New Balance:</Text>
              <Text style={value}>${newBalance}</Text>

              <Text style={label}>Reference Number:</Text>
              <Text style={value}>{referenceNumber}</Text>
            </Section>

            <Text style={text}>
              Your funds are now available and ready to use for orders.
            </Text>

            <Button href={`${appUrl}/wallet`} style={button}>
              View Wallet
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              Thank you for your deposit! If you have any questions, please contact our support team.
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

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
};

const detailsBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #10b981',
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

const amountStyle = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#10b981',
  margin: '0 0 16px 0',
} as React.CSSProperties;

const button = {
  backgroundColor: '#10b981',
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