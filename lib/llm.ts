const AI_SYSTEM_PROMPT = `Você é um assistente comercial para pequenos negócios brasileiros.

Sua função é gerar mensagens curtas de follow-up para clientes que já demonstraram interesse ou solicitaram orçamento.

Não pressione excessivamente o cliente.

Não invente descontos.

Não invente informações.

Não use linguagem agressiva.

Não prometa algo que não foi informado.

Use português brasileiro natural.

A mensagem deve parecer escrita por uma pessoa real.

Evite textos longos.

Retorne apenas a mensagem.`

const TONE_LABEL: Record<string, string> = {
  AMIGAVEL: 'Amigável',
  PROFISSIONAL: 'Profissional',
  DIRETO: 'Direto',
}

export type FollowupInput = {
  leadName: string
  service?: string | null
  value?: number | null
  status: string
  daysSinceContact?: number | null
  notes?: string | null
  tone: string
  businessName?: string | null
}

const STATUS_LABEL: Record<string, string> = {
  NOVO: 'Novo contato',
  PRIMEIRO_CONTATO:'Primeiro contato',
  AGUARDANDO_RESPOSTA:'Aguardando resposta',
  ORCAMENTO_ENVIADO: 'Orçamento enviado',
  NEGOCIANDO: 'Em negociação',
  FECHADO: 'Fechado',
  PERDIDO: 'Perdido',
}

function buildUserPrompt(input: FollowupInput): string {
  const parts: string[] = []
  parts.push(`Cliente: ${input.leadName}`)
  if (input.service) parts.push(`Serviço/produto: ${input.service}`)
  if (typeof input.value === 'number') {
    parts.push(`Valor estimado: R$ ${input.value.toFixed(2).replace('.', ',')}`)
  }
  parts.push(`Situação atual: ${STATUS_LABEL[input.status] ?? input.status}`)
  if (typeof input.daysSinceContact === 'number') {
    parts.push(`Dias desde o último contato: ${input.daysSinceContact}`)
  }
  if (input.notes) parts.push(`Observações: ${input.notes}`)
  if (input.businessName) parts.push(`Nome do meu negócio: ${input.businessName}`)
  parts.push(`Tom desejado: ${TONE_LABEL[input.tone] ?? 'Amigável'}`)
  parts.push('')
  parts.push('Escreva uma mensagem curta de follow-up para enviar a este cliente pelo WhatsApp.')
  return parts.join('\n')
}

/** Gera uma mensagem de follow-up via LLM. Lança erro em caso de falha. */
export async function generateFollowupMessage(input: FollowupInput): Promise<string> {
  const apiKey = process.env.ABACUSAI_API_KEY
  if (!apiKey) throw new Error('AI not configured')

  const res = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  })

  if (!res.ok) {
    throw new Error(`AI request failed: ${res.status}`)
  }

  const data = await res.json()
  const message = data?.choices?.[0]?.message?.content?.trim()
  if (!message) throw new Error('AI returned empty message')
  return message
}
