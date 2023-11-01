import { Button, Form, Input, List, Select, Spin } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { generateArrayOfNumbers } from 'common/helpers/array.helper';
import { navigateTo } from 'common/helpers/navigateTo.helper';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { convertFromRaw, EditorState } from 'draft-js';
import dynamic from 'next/dynamic';
import { EditorProps } from 'react-draft-wysiwyg';
const Editor = dynamic<EditorProps>(
  () => import('react-draft-wysiwyg').then((mod) => mod.Editor),
  { ssr: false },
);
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import {
  clearImageList,
  setDefaultImageList,
} from 'redux/slicers/mutipleImagesSlicer';
import { TMultipleImageState } from 'redux/types';
import { Page } from 'routes/constants';
import {
  Brand,
  Category,
  Color,
  Image,
  ParameterProduct,
  Product,
  Size,
  Tag,
} from 'swagger/services';

import FormItem from '../generalComponents/FormItem';
import {
  handleCategoryChange,
  handleFormSubmitProduct,
  initialValuesConverter,
  handleParameterChange,
  uploadImage,
} from './helpers';
import { ManageProductFields } from './ManageProductsFields.enum';
import styles from './products.module.scss';
import ProductVariantForm from './ProductVariantForm';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import color from 'components/store/lib/ui.colors';

const { Option } = Select;

type Props = {
  products: Product[];
  product?: Product;
  title: string;
  isLoading: boolean;
  isSaveLoading: boolean;
  editMode: boolean;
  tags: Tag[];
  sizes: Size[];
  colors: Color[];
  categories: Category[];
  brands: Brand[];
};

const ManageProductForm = ({
  title,
  products,
  product,
  isLoading,
  isSaveLoading,
  editMode,
  tags,
  sizes,
  colors,
  categories,
  brands,
}: Props) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [form] = Form.useForm();
  const initialValues = initialValuesConverter(product as Product);
  const [curCategory, setCurCategory] = useState<Category>();
  const [variants, setVariants] = useState<any[]>([]);
  const [parameterProducts, setParameterProducts] = useState<
    ParameterProduct[]
  >([]);
  const { imagesMap } = useAppSelector<TMultipleImageState>(
    (state) => state.multipleImages,
  );

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(),
  );

  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  const isConvertable = (data) => {
    if (typeof JSON.parse(data) == 'object') {
      return true;
    }
    return false;
  };
  useEffect(() => {
    if (
      !isLoading &&
      product &&
      isJsonString(product?.desc!) &&
      isConvertable(product?.desc!) &&
      product.desc !== ''
    ) {
      setEditorState(
        EditorState.createWithContent(
          convertFromRaw(JSON.parse(product.desc!)),
        ),
      );
    }
  }, [product]);

  useEffect(() => {
    for (let index = 0; index < product?.productVariants?.length!; index++) {
      initialValues[index]?.forEach((image) => {
        dispatch(setDefaultImageList({ file: image, index }));
      });
    }
    setCurCategory(product?.category);
    setParameterProducts(
      product?.category?.parameters?.map((parameter) => {
        const parameterProduct = product.parameterProducts?.find(
          (parameterProduct) => parameterProduct.parameterId === parameter.id,
        );

        return {
          parameter: parameter,
          value: parameterProduct?.value,
        };
      })!,
    );
    setVariants(generateArrayOfNumbers(product?.productVariants?.length ?? 0));
    return () => {
      dispatch(clearImageList());
    };
  }, [product]);

  const handleAddVariant = () => {
    setVariants((prev) => prev.concat({}));
  };

  return (
    <>
      <div className={styles.createProductHeader}>
        <h1 className={styles.createProductHeader__title}>{title}</h1>
      </div>
      {(isLoading || !product) && editMode ? (
        <Spin className={styles.spinner} size="large" />
      ) : (
        <Form
          layout="vertical"
          onFinish={handleFormSubmitProduct(
            router,
            dispatch,
            imagesMap,
            parameterProducts,
            variants.length,
          )}
          form={form}
          initialValues={initialValues}
          requiredMark={true}
          className={styles.createProductForm}
        >
          {/* ----------------------NAME---------------------- */}
          <FormItem
            option={ManageProductFields.Name}
            children={
              <Input required={true} placeholder="Введите имя продукта" />
            }
          />
          {/* ----------------------ULR---------------------- */}
          <FormItem
            option={ManageProductFields.Url}
            children={
              <Input required={true} placeholder="Введите Url продукта" />
            }
          />
          {/* ----------------------DESCRIPTION---------------------- */}
          <FormItem
            option={ManageProductFields.Desc}
            children={
              <Editor
                editorState={editorState}
                onEditorStateChange={setEditorState}
                wrapperClassName="wrapper-class"
                editorClassName="editor-class"
                toolbarClassName="toolbar-class"
                editorStyle={{
                  border: `1px solid ${color.textSecondary}`,
                  borderRadius: '5px',
                }}
                localization={{ locale: 'ru' }}
                toolbar={{
                  fontFamily: {
                    options: ['Jost', 'Anticva'],
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                  },
                  image: {
                    // icon: image,
                    className: undefined,
                    component: undefined,
                    popupClassName: undefined,
                    urlEnabled: true,
                    uploadEnabled: true,
                    alignmentEnabled: true,
                    uploadCallback: (file) => uploadImage(file, dispatch),
                    previewImage: true,
                    inputAccept:
                      'image/gif,image/jpeg,image/jpg,image/png,image/svg',
                    alt: { present: true, mandatory: false },
                    defaultSize: {
                      height: 'auto',
                      width: 'auto',
                    },
                  },
                }}
              />
            }
          />
          {/* ----------------------SHORT DESCRIPTION---------------------- */}
          <FormItem
            option={ManageProductFields.ShortDesc}
            children={
              <TextArea
                required={true}
                rows={4}
                placeholder="Краткое описание"
              />
            }
          />
          {/* ----------------------KEYWORDS---------------------- */}
          <FormItem
            option={ManageProductFields.Keywords}
            children={
              <TextArea required={true} rows={4} placeholder="keywords" />
            }
          />
          {/* ----------------------CATEGORIES---------------------- */}
          <Form.Item label="Категория" name="category" required>
            <Select
              onChange={handleCategoryChange(
                categories,
                setCurCategory,
                setParameterProducts,
              )}
              style={{ width: '100%' }}
            >
              {categories?.map((item) => {
                return (
                  <Option key={item.id} value={item.id}>
                    {item.parent?.name} / {item.name}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          {/* ----------------------BRANDS---------------------- */}
          <Form.Item label="Бренд" name="brand" required>
            <Select style={{ width: '100%' }}>
              {brands?.map((item) => {
                return (
                  <Option key={item.id} value={item.id}>
                    {item.name}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          {/* ----------------------TAGS---------------------- */}
          <Form.Item label="Теги" name="tags">
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder={`Пожалуйста, выберите теги`}
            >
              {tags?.map((item) => (
                <Option key={item.id} value={item.id}>{`${item.name}`}</Option>
              ))}
            </Select>
          </Form.Item>
          {/* ----------------------SIZES---------------------- */}
          <Form.Item label="Размер" name="sizes">
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder={`Пожалуйста, выберите Размер`}
            >
              {sizes?.map((item) => (
                <Option key={item.id} value={item.id}>{`${item.name}`}</Option>
              ))}
            </Select>
          </Form.Item>
          <h2 style={{ fontSize: '26px', marginBottom: '20px' }}>
            Варианты продукта
          </h2>
          <div className={styles['product-variants']}>
            {variants.map((variant, index) => (
              <ProductVariantForm
                key={`product-variant-${index}`}
                colors={colors}
                index={index}
                setVariants={setVariants}
                imagesList={imagesMap[index]}
              />
            ))}
            <Button type="primary" onClick={handleAddVariant}>
              Добавить вариант
            </Button>
          </div>
          {/* ----------------------IMAGES LIST---------------------- */}
          {!!curCategory?.parameters?.length && (
            <>
              <h2 style={{ marginBottom: '10px' }}>Список характеристик</h2>
              <List
                bordered={true}
                itemLayout="horizontal"
                dataSource={parameterProducts}
                style={{ marginBottom: '20px' }}
                renderItem={(parameterProduct, index) => (
                  <List.Item className={styles['list-item']}>
                    <span className={styles['list-item__title']}>
                      {parameterProduct.parameter?.name}
                    </span>
                    <Input
                      value={parameterProduct.value}
                      placeholder={'Ввдедите Значение характеристики'}
                      onChange={handleParameterChange(
                        index,
                        setParameterProducts,
                      )}
                    />
                  </List.Item>
                )}
              />
            </>
          )}
          {/* ----------------------THE END OF INPUTS---------------------- */}
          <Form.Item className={styles.createProductForm__buttonsStack}>
            <Button
              type="primary"
              htmlType="submit"
              className={styles.createProductForm__buttonsStack__submitButton}
              loading={isSaveLoading}
            >
              {products ? 'Сохранить' : 'Создать'}
            </Button>
            <Button
              type="primary"
              onClick={navigateTo(router, Page.ADMIN_PRODUCTS)}
            >
              Вернуться назад
            </Button>
          </Form.Item>
        </Form>
      )}
    </>
  );
};

export default ManageProductForm;
