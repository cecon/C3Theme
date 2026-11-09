import { FormEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { CURRENT_USER, Comment, Member } from './data';
import { MemberAvatar } from './shared';

interface CommentListProps {
  comments: Comment[];
  members: Member[];
  onAdd: (text: string) => void;
}

/** Comentários com autor e tempo relativo, e campo para comentar. */
export default function CommentList({ comments, members, onAdd }: CommentListProps) {
  const [text, setText] = useState('');
  const me = members.find((m) => m.id === CURRENT_USER);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  }

  return (
    <Stack spacing={2}>
      {comments.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nenhum comentário ainda.
        </Typography>
      )}
      {comments.map((c) => {
        const author = members.find((m) => m.id === c.authorId);
        return (
          <Stack key={c.id} direction="row" spacing={1.5}>
            <MemberAvatar member={author} />
            <Box sx={{ minWidth: 0, flex: 1, bgcolor: 'action.hover', borderRadius: 2, px: 1.5, py: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                <Typography variant="subtitle2">{author?.name ?? 'Alguém'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(c.at, { addSuffix: true, locale: ptBR })}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {c.text}
              </Typography>
            </Box>
          </Stack>
        );
      })}

      <Stack component="form" onSubmit={submit} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <MemberAvatar member={me} />
        <Stack spacing={1} sx={{ flex: 1, alignItems: 'flex-end' }}>
          <TextField
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva um comentário…"
            size="small"
            multiline
            minRows={2}
            fullWidth
            slotProps={{ htmlInput: { 'aria-label': 'Novo comentário' } }}
          />
          <Button type="submit" size="small" variant="contained" disabled={!text.trim()}>
            Comentar
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
