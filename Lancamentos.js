import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    FlatList, 
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
    Platform, 
    KeyboardAvoidingView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'http://192.168.0.164:3001';

const Lancamentos = () => {
  const [modalVisivel, setModalVisivel] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [lancamentosData, setLancamentosData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  
  const [categoria, setCategoria] = useState('Venda de Serviço');
  const [tipo, setTipo] = useState('Entrada');
  const [itemSelecionadoId, setItemSelecionadoId] = useState(null); 
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');

  const [servicosList, setServicosList] = useState([]);
  const [produtosList, setProdutosList] = useState([]);
  const [despesasList, setDespesasList] = useState([]);

  const fetchLancamentos = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/lancamentos`;
      if (filtroCategoria !== 'Todos') {
        url += `?categoria=${encodeURIComponent(filtroCategoria)}`; 
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setLancamentosData(data.data);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria]);

  const fetchCatalogo = async () => {
    try {
      const [servicosRes, produtosRes, despesasRes] = await Promise.all([
        fetch(`${API_URL}/servicos`),
        fetch(`${API_URL}/produtos`),
        fetch(`${API_URL}/despesas`),
      ]);
      const servicos = await servicosRes.json();
      const produtos = await produtosRes.json();
      const despesas = await despesasRes.json();

      if (servicos.success) setServicosList(servicos.data);
      if (produtos.success) setProdutosList(produtos.data);
      if (despesas.success) setDespesasList(despesas.data);
      
    } catch (error) {
      console.error('Erro ao buscar catálogo:', error);
    }
  };

  useEffect(() => {
    fetchLancamentos();
  }, [fetchLancamentos]);

  useEffect(() => {
    fetchCatalogo();
  }, []);

  const cleanForm = () => {
    setEditingItem(null);
    setCategoria('Venda de Serviço');
    setTipo('Entrada');
    setItemSelecionadoId(null);
    setDescricao('');
    setValor('');
    setFormaPagamento('Dinheiro');
  };

  useEffect(() => {
    if (!modalVisivel) return;
    
    if (!editingItem) {
      setItemSelecionadoId(null);
      setDescricao('');
      setValor('');
    }

    if (categoria === 'Venda de Serviço' || categoria === 'Venda de Produto') {
      setTipo('Entrada');
      if (!editingItem) setFormaPagamento('Dinheiro');
    } else if (categoria === 'Despesa') {
      setTipo('Saída');
    }
  }, [categoria, modalVisivel, editingItem]);

  const handleItemCatalogSelection = (itemId) => {
    setItemSelecionadoId(itemId);
    if (!itemId) {
      setDescricao('');
      setValor('');
      return;
    }

    let item;
    if (categoria === 'Venda de Serviço') {
      item = servicosList.find(s => s.id === itemId);
      setDescricao(item?.nome_servico || '');
      setValor(String(item?.preco || ''));
    } else if (categoria === 'Venda de Produto') {
      item = produtosList.find(p => p.id === itemId);
      setDescricao(item?.nome_produto || '');
      setValor(String(item?.preco_venda || ''));
    } else if (categoria === 'Despesa') {
      item = despesasList.find(d => d.id === itemId);
      setDescricao(item?.descricao || '');
      setValor(String(item?.valor || ''));
    }
  };

  const handleSalvarLancamento = async () => {
    if (!descricao || !valor) {
      Alert.alert('Erro', 'Descrição e Valor são obrigatórios.');
      return;
    }

    const method = editingItem ? 'PUT' : 'POST';
    const endpoint = editingItem ? `${API_URL}/lancamentos/${editingItem.id}` : `${API_URL}/lancamentos`;

    const body = {
      tipo: tipo,
      categoria: categoria,
      descricao: descricao,
      valor: parseFloat(valor),
      forma_pagamento: formaPagamento,
      id_servico_vendido: categoria === 'Venda de Serviço' ? itemSelecionadoId : null,
      id_produto_vendido: categoria === 'Venda de Produto' ? itemSelecionadoId : null,
    };
    
    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        setModalVisivel(false);
        cleanForm();
        fetchLancamentos();
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    }
  };

  const handleShowEditModal = (item) => {
    setEditingItem(item);
    setCategoria(item.categoria);
    setTipo(item.tipo);
    setDescricao(item.descricao);
    setValor(String(item.valor));
    setFormaPagamento(item.forma_pagamento);
    setItemSelecionadoId(item.id_servico_vendido || item.id_produto_vendido || null);
    setModalVisivel(true);
  };

  const handleDeleteItem = (id) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este lançamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/lancamentos/${id}`, { method: 'DELETE' });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Sucesso', data.message);
                fetchLancamentos();
              } else {
                Alert.alert('Erro', data.message);
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          } 
        }
      ]
    );
  };

  const renderLancamentoItem = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={styles.tableCellDesc}>
        <Text style={styles.itemDescricao} numberOfLines={1}>{item.descricao}</Text>
        <Text style={styles.itemCategoria}>
          {item.categoria} 
          {item.tipo === 'Entrada' && ` (${item.forma_pagamento || 'N/A'})`}
          {item.tipo === 'Saída' && item.forma_pagamento && ` (${item.forma_pagamento})`}
          {item.tipo === 'Saída' && !item.forma_pagamento && ` (Despesa)`}
        </Text>
        <Text style={styles.itemData}>{new Date(item.data_lancamento).toLocaleDateString('pt-BR')}</Text>
      </View>
      <View style={styles.tableCellValor}>
        <Text style={item.tipo === 'Entrada' ? styles.itemValorEntrada : styles.itemValorSaida}>
          {item.tipo === 'Entrada' ? '+' : '-'} R$ {parseFloat(item.valor).toFixed(2)}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={() => handleShowEditModal(item)} style={styles.actionButton}>
          <Text style={styles.actionTextEdit}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.actionButton}>
          <Text style={styles.actionTextDelete}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItemPicker = () => {
    let pickerData = [];
    let label = "";

    if (categoria === 'Venda de Serviço') {
      pickerData = servicosList;
      label = "Selecione um Serviço";
    } else if (categoria === 'Venda de Produto') {
      pickerData = produtosList;
      label = "Selecione um Produto";
    } else if (categoria === 'Despesa') {
      pickerData = despesasList;
      label = "Selecione uma Despesa Padrão";
    }

    return (
      <>
        <Text style={styles.pickerLabel}>{label} (Opcional)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={itemSelecionadoId}
            onValueChange={(itemValue) => handleItemCatalogSelection(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem} // Apenas iOS usa isso
          >
            <Picker.Item label={`-- ${label} --`} value={null} />
            {pickerData.map(item => (
              <Picker.Item 
                key={item.id} 
                label={item.nome_servico || item.nome_produto || item.descricao} 
                value={item.id} 
                // Cor condicional para evitar texto branco no fundo branco no Android
                color={Platform.OS === 'ios' ? '#000' : '#333'}
              />
            ))}
          </Picker>
        </View>
        <Text style={styles.pickerLabel}>Ou digite manualmente:</Text>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        {/* Ajuste de comportamento do teclado para evitar bugs no Android */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{editingItem ? 'Editar' : 'Adicionar'} Lançamento</Text>

              <Text style={styles.pickerLabel}>Categoria</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={categoria}
                  onValueChange={(itemValue) => setCategoria(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem} 
                  enabled={!editingItem}
                >
                  <Picker.Item label="Venda de Serviço" value="Venda de Serviço" />
                  <Picker.Item label="Venda de Produto" value="Venda de Produto" />
                  <Picker.Item label="Despesa" value="Despesa" />
                </Picker>
              </View>

              {!editingItem && renderItemPicker()}

              <TextInput 
                style={styles.input} 
                placeholder="Descrição" 
                placeholderTextColor="#999" 
                value={descricao} 
                onChangeText={setDescricao} 
                editable={!itemSelecionadoId || !!editingItem}
              />
              <TextInput 
                style={styles.input} 
                placeholder="Valor" 
                placeholderTextColor="#999" 
                keyboardType="numeric" 
                value={valor} 
                onChangeText={setValor} 
              />

              {(tipo === 'Entrada' || tipo === 'Saída') && (
                <>
                  <Text style={styles.pickerLabel}>Forma de Pagamento</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formaPagamento}
                      onValueChange={(itemValue) => setFormaPagamento(itemValue)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem} 
                    >
                      <Picker.Item label="Dinheiro" value="Dinheiro" />
                      <Picker.Item label="PIX" value="PIX" />
                      <Picker.Item label="Cartão de Crédito" value="Cartão de Crédito" />
                      <Picker.Item label="Cartão de Débito" value="Cartão de Débito" />
                    </Picker>
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.buttonCancelar} onPress={() => {
                  setModalVisivel(false);
                  cleanForm();
                }}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonSalvar} onPress={handleSalvarLancamento}>
                  <Text style={styles.buttonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Text style={styles.title}>Lançamentos</Text>
      
      <View style={styles.filterContainer}>
        <Text style={styles.pickerLabelFiltro}>Filtrar por Categoria:</Text>
        <View style={styles.pickerContainerFiltro}>
          <Picker
            selectedValue={filtroCategoria}
            onValueChange={(itemValue) => setFiltroCategoria(itemValue)}
            style={styles.pickerFiltro}
            itemStyle={styles.pickerItemFiltro} 
            dropdownIconColor="#fff"
            // Cor do texto no Android (drop-down fechado)
            mode="dropdown"
          >
            <Picker.Item label="Mostrar Todos" value="Todos" color={Platform.OS === 'ios' ? '#fff' : '#000'} />
            <Picker.Item label="Serviço" value="Venda de Serviço" color={Platform.OS === 'ios' ? '#fff' : '#000'} />
            <Picker.Item label="Produto" value="Venda de Produto" color={Platform.OS === 'ios' ? '#fff' : '#000'} />
            <Picker.Item label="Despesa" value="Despesa" color={Platform.OS === 'ios' ? '#fff' : '#000'} />
          </Picker>
        </View>
      </View>
      
      <View style={styles.box}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <FlatList 
            data={lancamentosData}
            renderItem={renderLancamentoItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<Text style={styles.semDadosTexto}>Nenhum lançamento encontrado.</Text>}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => {
        cleanForm();
        setModalVisivel(true);
      }}>
        <Text style={styles.buttonText}>+ Novo Lançamento</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(1, 67, 70, 1)',
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    alignSelf: 'center',
  },
  filterContainer: {
    flexDirection: 'column', // Alterado para coluna para o texto ficar em cima
    marginBottom: 10,
  },
  pickerLabelFiltro: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5, // Espaço entre label e picker
    marginLeft: 5,
  },
  pickerContainerFiltro: {
    width: '100%',
    // No Android, 50 é padrão. No iOS, usamos 100 para ver a roleta.
    height: Platform.OS === 'ios' ? 50 : 50,
    backgroundColor: 'rgba(0, 107, 111, 0.87)',
    borderRadius: 15,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickerFiltro: {
    width: '100%',
    // Altura do componente Picker deve acompanhar o container
    height: Platform.OS === 'ios' ? 100 : 50,
    color: '#fff', // Cor do texto selecionado (funciona mais no Android)
  },
  pickerItemFiltro: {
    fontSize: 13,
    height: 100, // Altura do item no iOS
    color: '#fff',
  },
  
  // --- ESTILOS DOS PICKERS DO MODAL ---
  pickerContainer: {
    width: '100%',
    // Android padrão 50, iOS 100 para não ficar enorme
    height: Platform.OS === 'ios' ? 60 : 50, 
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 100 : 50,
    color: '#333',
  },
  pickerItem: {
    fontSize: 14,
    height: 100, 
    color: '#000',
  },

  box: {
    flex: 1,
    backgroundColor: 'rgba(0, 107, 111, 0.87)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 5,
  },
  listContent: {
    paddingBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableCellDesc: {
    flex: 3,
    paddingRight: 5,
  },
  itemDescricao: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  itemCategoria: {
    color: '#ddd',
    fontSize: 11,
  },
  itemData: {
    color: '#aaa',
    fontSize: 11,
    fontStyle: 'italic',
  },
  tableCellValor: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  itemValorEntrada: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemValorSaida: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  actionButton: {
    padding: 5,
  },
  actionTextEdit: {
    color: '#68c8f0',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 8,
  },
  actionTextDelete: {
    color: '#f07a68',
    fontWeight: 'bold',
    fontSize: 12,
  },
  semDadosTexto: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
    height: 45,
    backgroundColor: '#003a38ff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, 
    elevation: 3,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // IMPORTANTE: Fundo escuro no modal
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 30,
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 45,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  pickerLabel: {
    fontSize: 13,
    color: '#555',
    alignSelf: 'flex-start',
    marginBottom: 3,
    marginLeft: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  buttonSalvar: {
    flex: 1,
    height: 45,
    backgroundColor: 'rgba(0, 107, 111, 0.87)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  buttonCancelar: {
    flex: 1,
    height: 45,
    backgroundColor: '#c0392b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(1, 67, 70, 1)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  }
});

export default Lancamentos;