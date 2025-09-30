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

interface DepositRejectedEmailProps {
  userName: string;
  amount: string;
  reason: string;
  appUrl: string;
}

export default function DepositRejectedEmail({
  userName,
  amount,
  reason,
  appUrl,
}: DepositRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your deposit request was not approved</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Deposit Not Approved</Text>

          <Section style={section}>
            <Text style={text}>
              Hello {userName}, we were unable to approve your deposit request at this time.
            </Text>

            <Section style={detailsBox}>
              <Text style={label}>Amount:</Text>
              <Text style={amountStyle}>${amount}</Text>

              <Text style={label}>Reason:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>

            <Text style={text}>
              Common reasons for rejection include:
            </Text>

            <Text style={list}>
              • Receipt image is unclear or unreadable<br />
              • Payment information doesn't match our records<br />
              • Transfer amount doesn't match the submitted amount<br />
              • Receipt appears to be altered or invalid
            </Text>

            <Text style={text}>
              Please review your deposit information and submit a new request with corrected details.
            </Text>

            <Button href={`${appUrl}/wallet/deposit`} style={button}>
              Submit New Deposit
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              If you believe this is an error or need assistance, please contact our support team.
              We're here to help!
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
  marginBottom: '12px',
};

const detailsBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #ef4444',
};

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '8px 0 4px 0',
};

const amountStyle = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#ef4444',
  margin: '0 0 16px 0',
} as React.CSSProperties;

const reasonText = {
  fontSize: '16px',
  color: '#1f2937',
  margin: '0',
  padding: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
};

const list = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '24px',
  margin: '12px 0',
};

const button = {
  backgroundColor: '#3b82f6',
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