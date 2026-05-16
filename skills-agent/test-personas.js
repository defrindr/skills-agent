#!/usr/bin/env node
/**
 * Test persona system loading
 */

import { personaManager } from './dist/skills/persona-manager.js';
import { skillManager } from './dist/skills/manager.js';
import { contextBuilder } from './dist/skills/context-builder.js';

async function testPersonaSystem() {
  console.log('🧪 Testing Persona System...\n');

  try {
    // 1. Load personas
    console.log('1️⃣ Loading personas...');
    await personaManager.loadAll();
    const personas = personaManager.getAllPersonas();
    console.log(`✅ Loaded ${personas.length} personas: ${personas.map(p => p.name).join(', ')}\n`);

    // 2. Load skills
    console.log('2️⃣ Loading skills...');
    await skillManager.loadAll();
    const skills = skillManager.getAllSkills();
    console.log(`✅ Loaded ${skills.length} skills\n`);

    // 3. Test context building with default persona
    console.log('3️⃣ Testing context builder with senior-engineer persona...');
    const context1 = await contextBuilder.build({
      persona: 'senior-engineer',
      skills: ['project-readability'],
      compressionLevel: 'compact'
    });
    console.log(`✅ Context size: ${context1.length} chars\n`);

    // 4. Test context building with red-team persona
    console.log('4️⃣ Testing context builder with red-team persona...');
    const context2 = await contextBuilder.build({
      persona: 'red-team',
      skills: ['project-readability'],
      compressionLevel: 'compact'
    });
    console.log(`✅ Context size: ${context2.length} chars\n`);

    // 5. Test persona formatting levels
    console.log('5️⃣ Testing persona formatting levels...');
    const redTeam = personaManager.load('red-team');
    if (redTeam) {
      const minimal = personaManager.formatPersona(redTeam, 'minimal');
      const compact = personaManager.formatPersona(redTeam, 'compact');
      const full = personaManager.formatPersona(redTeam, 'full');
      console.log(`✅ Minimal: ${minimal.length} chars`);
      console.log(`✅ Compact: ${compact.length} chars`);
      console.log(`✅ Full: ${full.length} chars\n`);
    }

    console.log('✅ All tests passed!\n');
    
    console.log('📝 Sample context preview (red-team, compact):');
    console.log('---');
    console.log(context2.substring(0, 500) + '...\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPersonaSystem();
